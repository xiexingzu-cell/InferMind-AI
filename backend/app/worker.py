import asyncio
from pathlib import Path

from sqlalchemy import select

from app.config import settings
from app.core.logger import configure_logging, get_logger
from app.database import AsyncSessionLocal
from app.models.competition_project import CompetitionProject
from app.redis_client import get_redis
from app.router.model_router import route_completion
from app.schemas.chat import ChatCompletionRequest
from app.services.competition_prompts import build_stage_messages
from app.services.artifact_writer import artifacts_from_paths, write_stage_artifacts
from app.services.mock_analysis_assets import write_mock_analysis_assets
from app.services.mock_competition import mock_stage_output
from app.services.sandbox_runner import execute_python, extract_python_code

configure_logging(settings.log_level)
logger = get_logger(__name__)


async def _stage_output(project: CompetitionProject, stage_id: str) -> str:
    if settings.competition_model == "local-competition-mock":
        return mock_stage_output(project, stage_id)

    response = await route_completion(
        ChatCompletionRequest(
            model=settings.competition_model,
            messages=build_stage_messages(project, stage_id),
            temperature=0.3,
        )
    )
    content = response.choices[0].message.content
    if not isinstance(content, str):
        raise ValueError("Competition worker expected a text response.")
    return content


async def process_job(payload: str) -> None:
    project_id, stage_id = payload.split(":", maxsplit=1)
    async with AsyncSessionLocal() as db:
        project = await db.scalar(select(CompetitionProject).where(CompetitionProject.id == project_id))
        if project is None:
            logger.warning("competition project missing", project_id=project_id)
            return
        stages = [dict(stage) for stage in project.stages]
        index = next((i for i, stage in enumerate(stages) if stage["id"] == stage_id), None)
        if index is None:
            logger.warning("competition stage missing", project_id=project_id, stage_id=stage_id)
            return
        stages[index]["status"] = "running"
        project.stages = stages
        await db.commit()

        try:
            output = await _stage_output(project, stage_id)
        except Exception:
            stages = [dict(stage) for stage in project.stages]
            stages[index]["status"] = "failed"
            stages[index]["output"] = "阶段执行失败，请检查模型配置后重试。"
            project.stages = stages
            project.status = "failed"
            await db.commit()
            raise

        try:
            stages = [dict(stage) for stage in project.stages]
            stages[index]["status"] = "completed"
            stages[index]["output"] = output
            project.stages = stages
            for artifact in write_stage_artifacts(project, stage_id, output):
                db.add(artifact)
            if stage_id == "coding":
                code = extract_python_code(output)
                project_dir = Path(settings.competition_storage_path) / project.id
                if settings.competition_model == "local-competition-mock":
                    for artifact in artifacts_from_paths(
                        project.id, stage_id, write_mock_analysis_assets(project_dir)
                    ):
                        db.add(artifact)
                elif code:
                    for artifact in artifacts_from_paths(
                        project.id, stage_id, execute_python(code, project_dir)
                    ):
                        db.add(artifact)
            await db.commit()
        except Exception:
            await db.rollback()
            await db.refresh(project)
            stages = [dict(stage) for stage in project.stages]
            stages[index]["status"] = "failed"
            stages[index]["output"] = "阶段执行失败，请检查模型或 Runner 配置后重试。"
            project.stages = stages
            project.status = "failed"
            await db.commit()
            raise
        logger.info("competition stage completed", project_id=project_id, stage_id=stage_id)


async def run_worker() -> None:
    redis = get_redis()
    logger.info("competition worker ready", queue=settings.competition_queue_name)
    while True:
        item = await redis.blpop(settings.competition_queue_name, timeout=5)
        if item is None:
            continue
        _, payload = item
        try:
            if isinstance(payload, bytes):
                payload = payload.decode("utf-8")
            await process_job(payload)
        except Exception as exc:
            logger.exception("competition job failed", exc=str(exc))


if __name__ == "__main__":
    asyncio.run(run_worker())

import hashlib
import secrets
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import get_current_key
from app.database import get_db
from app.models.api_key import ApiKey
from app.models.competition_artifact import CompetitionArtifact
from app.models.competition_file import CompetitionFile
from app.models.competition_project import CompetitionProject
from app.redis_client import get_redis
from app.schemas.competition import (
    CompetitionFileResponse,
    CompetitionArtifactResponse,
    CompetitionProjectCreate,
    CompetitionProjectCreated,
    CompetitionProjectResponse,
    CompetitionSummary,
)
from app.services.competition_catalog import COMPETITIONS, get_competition, initial_stage_states
from app.services.file_policy import classify_upload, validate_zip

router = APIRouter()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _project_dir(project_id: str) -> Path:
    path = Path(settings.competition_storage_path) / project_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def _uploads_dir(project_id: str) -> Path:
    path = _project_dir(project_id) / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _artifact_path(project_id: str, stored_name: str) -> Path:
    project_dir = _project_dir(project_id).resolve()
    path = (project_dir / stored_name).resolve()
    if path != project_dir and project_dir not in path.parents:
        raise HTTPException(status_code=404, detail="Artifact file not found.")
    return path


async def _get_project(
    project_id: str,
    project_token: str = Header(alias="X-Project-Token"),
    db: AsyncSession = Depends(get_db),
) -> CompetitionProject:
    project = await db.get(CompetitionProject, project_id)
    if project is None or not secrets.compare_digest(project.access_token_hash, _hash_token(project_token)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


async def _project_response(project: CompetitionProject, db: AsyncSession) -> CompetitionProjectResponse:
    file_result = await db.execute(
        select(CompetitionFile)
        .where(CompetitionFile.project_id == project.id)
        .order_by(CompetitionFile.created_at.desc())
    )
    artifact_result = await db.execute(
        select(CompetitionArtifact)
        .where(CompetitionArtifact.project_id == project.id)
        .order_by(CompetitionArtifact.created_at.desc())
    )
    return CompetitionProjectResponse.model_validate({
        **project.__dict__,
        "files": file_result.scalars().all(),
        "artifacts": artifact_result.scalars().all(),
    })


@router.get("/competitions", response_model=list[CompetitionSummary])
async def list_competitions(_: ApiKey = Depends(get_current_key)):
    return COMPETITIONS


@router.post(
    "/competition-projects",
    response_model=CompetitionProjectCreated,
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    body: CompetitionProjectCreate,
    _: ApiKey = Depends(get_current_key),
    db: AsyncSession = Depends(get_db),
):
    if get_competition(body.competition_id) is None:
        raise HTTPException(status_code=400, detail="Unsupported competition type.")

    project_token = secrets.token_urlsafe(32)
    project = CompetitionProject(
        id=str(uuid4()),
        access_token_hash=_hash_token(project_token),
        competition_id=body.competition_id,
        title=body.title.strip(),
        problem_statement=body.problem_statement.strip(),
        notes=body.notes.strip(),
        stages=initial_stage_states(body.competition_id),
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    _project_dir(project.id)
    response = await _project_response(project, db)
    return CompetitionProjectCreated(**response.model_dump(), access_token=project_token)


@router.get("/competition-projects/{project_id}", response_model=CompetitionProjectResponse)
async def get_project(
    project: CompetitionProject = Depends(_get_project),
    db: AsyncSession = Depends(get_db),
):
    return await _project_response(project, db)


@router.post(
    "/competition-projects/{project_id}/files",
    response_model=CompetitionFileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_project_file(
    file: UploadFile = File(...),
    project: CompetitionProject = Depends(_get_project),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read(settings.competition_max_upload_bytes + 1)
    try:
        safety_status = classify_upload(
            file.filename or "", len(content), settings.competition_max_upload_bytes
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if safety_status == "blocked":
        raise HTTPException(status_code=400, detail="Executable or script uploads are not allowed.")
    if Path(file.filename or "").suffix.lower() == ".zip":
        try:
            validate_zip(content)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    file_id = str(uuid4())
    suffix = Path(file.filename or "").suffix.lower()
    stored_name = f"{file_id}{suffix}"
    (_uploads_dir(project.id) / stored_name).write_bytes(content)
    record = CompetitionFile(
        id=file_id,
        project_id=project.id,
        filename=file.filename or stored_name,
        stored_name=stored_name,
        media_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        safety_status=safety_status,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


@router.post("/competition-projects/{project_id}/stages/{stage_id}/run")
async def run_stage(
    stage_id: str,
    project: CompetitionProject = Depends(_get_project),
    db: AsyncSession = Depends(get_db),
):
    stages = [dict(stage) for stage in project.stages]
    index = next((i for i, stage in enumerate(stages) if stage["id"] == stage_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Stage not found.")
    if stages[index]["status"] not in {"ready", "failed"}:
        raise HTTPException(status_code=409, detail="Stage is not ready to run.")
    stages[index]["status"] = "queued"
    project.stages = stages
    project.status = "running"
    await db.flush()
    await get_redis().rpush(settings.competition_queue_name, f"{project.id}:{stage_id}")
    return {"status": "queued", "stage_id": stage_id}


@router.post("/competition-projects/{project_id}/stages/{stage_id}/confirm")
async def confirm_stage(
    stage_id: str,
    project: CompetitionProject = Depends(_get_project),
    db: AsyncSession = Depends(get_db),
):
    stages = [dict(stage) for stage in project.stages]
    index = next((i for i, stage in enumerate(stages) if stage["id"] == stage_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Stage not found.")
    if stages[index]["status"] != "completed":
        raise HTTPException(status_code=409, detail="Only completed stages can be confirmed.")
    stages[index]["status"] = "confirmed"
    if index + 1 < len(stages):
        stages[index + 1]["status"] = "ready"
        project.status = "draft"
    else:
        project.status = "completed"
    project.stages = stages
    await db.flush()
    return {"status": project.status, "stage_id": stage_id}


@router.get(
    "/competition-projects/{project_id}/artifacts",
    response_model=list[CompetitionArtifactResponse],
)
async def list_artifacts(
    project: CompetitionProject = Depends(_get_project),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompetitionArtifact)
        .where(CompetitionArtifact.project_id == project.id)
        .order_by(CompetitionArtifact.created_at.desc())
    )
    return result.scalars().all()


@router.get("/competition-projects/{project_id}/artifacts/{artifact_id}/download")
async def download_artifact(
    artifact_id: str,
    project: CompetitionProject = Depends(_get_project),
    db: AsyncSession = Depends(get_db),
):
    artifact = await db.get(CompetitionArtifact, artifact_id)
    if artifact is None or artifact.project_id != project.id:
        raise HTTPException(status_code=404, detail="Artifact not found.")
    path = _artifact_path(project.id, artifact.stored_name)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Artifact file not found.")
    return FileResponse(path, media_type=artifact.media_type, filename=artifact.filename)

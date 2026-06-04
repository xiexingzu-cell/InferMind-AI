from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.logger import configure_logging, get_logger
from app.database import create_tables
from app.redis_client import close_pool
from app.api.v1 import chat, competitions, models, keys, usage
from app import models as _models  # noqa: F401

configure_logging(settings.log_level)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup: creating tables")
    await create_tables()
    logger.info("startup: ready")
    yield
    await close_pool()
    logger.info("shutdown: complete")


app = FastAPI(
    title="InferMind",
    description="OpenAI-compatible multi-model inference platform.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

_cors_origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled exception", path=str(request.url), exc=str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "Internal server error.",
                "type": "server_error",
                "code": "internal_error",
            }
        },
    )


# Mount OpenAI-compatible routes
app.include_router(chat.router, prefix="/v1", tags=["completions"])
app.include_router(models.router, prefix="/v1", tags=["models"])

# Mount platform management routes
app.include_router(keys.router, prefix="/api", tags=["keys"])
app.include_router(usage.router, prefix="/api", tags=["usage"])
app.include_router(competitions.router, prefix="/api", tags=["competitions"])


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "version": app.version}

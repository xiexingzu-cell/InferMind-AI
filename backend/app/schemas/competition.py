from datetime import datetime

from pydantic import BaseModel, Field


class StageState(BaseModel):
    id: str
    name: str
    description: str
    status: str
    output: str = ""


class CompetitionSummary(BaseModel):
    id: str
    name: str
    short_name: str
    category: str
    language: str
    description: str
    stages: list[dict[str, str]]


class CompetitionProjectCreate(BaseModel):
    competition_id: str
    title: str = Field(min_length=2, max_length=160)
    problem_statement: str = Field(min_length=10, max_length=50000)
    notes: str = Field(default="", max_length=10000)


class CompetitionFileResponse(BaseModel):
    id: str
    filename: str
    media_type: str
    size_bytes: int
    safety_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CompetitionArtifactResponse(BaseModel):
    id: str
    stage_id: str
    filename: str
    media_type: str
    size_bytes: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CompetitionProjectResponse(BaseModel):
    id: str
    competition_id: str
    title: str
    problem_statement: str
    notes: str
    status: str
    stages: list[StageState]
    files: list[CompetitionFileResponse] = Field(default_factory=list)
    artifacts: list[CompetitionArtifactResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompetitionProjectCreated(CompetitionProjectResponse):
    access_token: str

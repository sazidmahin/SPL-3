from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

GenerationJobStatus = Literal["pending", "running", "completed", "failed", "partially_completed"]
GenerationJobType = Literal["srs", "class_diagram", "full"]
DiagramMethod = Literal["llm", "rule_based"]


class RequirementInputCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    raw_text: str = Field(min_length=1, max_length=50000)


class RequirementInputRead(BaseModel):
    id: UUID
    workspace_id: UUID
    project_id: UUID
    title: str
    raw_text: str
    created_by_user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SrsGenerateRequest(RequirementInputCreateRequest):
    generate_class_diagram: bool = False
    diagram_methods: list[DiagramMethod] = Field(default_factory=list)


class GenerationJobRead(BaseModel):
    id: UUID
    workspace_id: UUID
    project_id: UUID
    requirement_input_id: UUID
    job_type: GenerationJobType
    status: GenerationJobStatus
    progress_percent: int
    generate_class_diagram: bool
    diagram_methods: list[str]
    result_payload: dict | None
    error_message: str | None
    created_by_user_id: UUID
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class SrsGenerateResponse(BaseModel):
    requirement_input: RequirementInputRead
    job: GenerationJobRead
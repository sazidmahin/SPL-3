from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.diagram import DiagramDetailRead

GenerationJobStatus = Literal["pending", "running", "completed", "failed", "partially_completed"]
GenerationJobType = Literal["srs", "class_diagram", "full"]
DiagramMethod = Literal["llm", "rule_based"]
RequirementType = Literal["functional", "non_functional"]
ClarificationStatus = Literal["not_required", "pending", "clarified"]


class RequirementInputCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    raw_text: str = Field(min_length=1, max_length=50000)


class ClarifyingQuestion(BaseModel):
    id: str
    question: str
    reason: str


class ClarificationAnswer(BaseModel):
    question_id: str = Field(min_length=1, max_length=128)
    answer: str = Field(min_length=1, max_length=5000)


class RequirementInputRead(BaseModel):
    id: UUID
    workspace_id: UUID
    project_id: UUID
    title: str
    raw_text: str
    clarification_status: ClarificationStatus = "not_required"
    clarifying_questions: list[ClarifyingQuestion] = Field(default_factory=list)
    clarification_answers: list[ClarificationAnswer] = Field(default_factory=list)
    refined_text: str | None = None
    refinement_metadata: dict | None = None
    created_by_user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SrsIntakeRequest(RequirementInputCreateRequest):
    pass


class SrsIntakeResponse(BaseModel):
    requirement_input: RequirementInputRead
    needs_clarification: bool
    clarifying_questions: list[ClarifyingQuestion] = Field(default_factory=list)
    draft_requirement: str


class ClarificationAnswerRequest(BaseModel):
    answers: list[ClarificationAnswer] = Field(min_length=1)


class ClarificationAnswerResponse(BaseModel):
    requirement_input: RequirementInputRead
    needs_clarification: bool
    refined_requirement: str


class SrsGenerateRequest(BaseModel):
    requirement_input_id: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    raw_text: str | None = Field(default=None, min_length=1, max_length=50000)
    generate_class_diagram: bool = False
    diagram_methods: list[DiagramMethod] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_input_source(self) -> "SrsGenerateRequest":
        if self.requirement_input_id is not None:
            return self
        if self.title is not None and self.raw_text is not None:
            return self
        raise ValueError("Either requirement_input_id or both title and raw_text are required")


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


class ExtractedRequirementRead(BaseModel):
    id: UUID
    workspace_id: UUID
    project_id: UUID
    srs_document_id: UUID
    requirement_input_id: UUID
    generation_job_id: UUID
    requirement_code: str
    requirement_text: str
    requirement_type: RequirementType
    nfr_subtype: str | None
    source_trace: str
    extraction_reason: str
    confidence_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SrsDocumentRead(BaseModel):
    id: UUID
    workspace_id: UUID
    project_id: UUID
    requirement_input_id: UUID
    generation_job_id: UUID
    title: str
    status: str
    content_markdown: str
    content_json: dict
    created_by_user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SrsDocumentDetailRead(SrsDocumentRead):
    extracted_requirements: list[ExtractedRequirementRead]


class SrsGenerateResponse(BaseModel):
    requirement_input: RequirementInputRead
    job: GenerationJobRead
    srs_document: SrsDocumentDetailRead
    diagrams: list[DiagramDetailRead] = Field(default_factory=list)

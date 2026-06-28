from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AdminUserRead(BaseModel):
    id: UUID
    email: str
    full_name: str
    avatar_url: str | None
    status: str
    platform_role: str
    is_platform_admin: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminWorkspaceRead(BaseModel):
    id: UUID
    name: str
    slug: str
    type: str
    owner_user_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminSubscriptionRead(BaseModel):
    id: UUID
    workspace_id: UUID
    plan_id: UUID
    status: str
    current_period_start: date
    current_period_end: date
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProjectRead(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: str | None
    status: str
    created_by_user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminGenerationJobRead(BaseModel):
    id: UUID
    workspace_id: UUID
    project_id: UUID
    requirement_input_id: UUID
    job_type: str
    status: str
    progress_percent: int
    generate_class_diagram: bool
    diagram_methods: list[str]
    result_payload: dict[str, Any] | None
    error_message: str | None
    created_by_user_id: UUID
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class AdminLlmCallRead(BaseModel):
    id: UUID
    workspace_id: UUID
    project_id: UUID
    generation_job_id: UUID | None
    prompt_template_id: UUID | None
    provider: str
    model_name: str
    status: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    error_message: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminAuditLogRead(BaseModel):
    id: UUID
    admin_user_id: UUID
    action: str
    target_type: str
    target_id: UUID | None
    metadata: dict[str, Any] | None = None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime


class PlatformSettingRead(BaseModel):
    id: UUID
    key: str
    value: Any
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlatformSettingUpsertRequest(BaseModel):
    value: Any
    description: str | None = Field(default=None, max_length=5000)

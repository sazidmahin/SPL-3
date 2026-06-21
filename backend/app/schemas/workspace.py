from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class WorkspaceRead(BaseModel):
    id: UUID
    name: str
    slug: str
    type: str
    owner_user_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkspaceMembershipRead(BaseModel):
    workspace: WorkspaceRead
    role: str
    status: str

    model_config = ConfigDict(from_attributes=True)

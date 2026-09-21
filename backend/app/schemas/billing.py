from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PlanRead(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None
    workspace_type: str
    price_cents_monthly: int
    max_projects: int
    max_members: int
    monthly_srs_generations: int
    monthly_ai_diagram_generations: int
    monthly_manual_diagram_saves: int
    can_use_manual_drawio: bool
    can_generate_srs: bool
    can_generate_ai_diagrams: bool
    can_export_srs: bool
    can_export_diagrams: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubscriptionRead(BaseModel):
    id: UUID
    workspace_id: UUID
    plan_id: UUID
    status: str
    current_period_start: date
    current_period_end: date
    plan: PlanRead

    model_config = ConfigDict(from_attributes=True)


class UsageRead(BaseModel):
    id: UUID
    workspace_id: UUID
    period_key: str
    srs_generations: int
    ai_diagram_generations: int
    manual_diagram_saves: int

    model_config = ConfigDict(from_attributes=True)


class CheckoutRequest(BaseModel):
    plan_code: str


class CheckoutResponse(BaseModel):
    checkout_session_id: str
    checkout_url: str
    plan: PlanRead
    subscription: SubscriptionRead
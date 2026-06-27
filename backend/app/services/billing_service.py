import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Plan, Project, Subscription, UsageCounter, Workspace, WorkspaceMember

DEFAULT_PLANS = [
    {
        "code": "free_individual",
        "name": "Free Individual",
        "description": "Starter plan for personal workspaces.",
        "workspace_type": "personal",
        "price_cents_monthly": 0,
        "max_projects": 3,
        "max_members": 1,
        "monthly_srs_generations": 0,
        "monthly_ai_diagram_generations": 0,
        "monthly_manual_diagram_saves": 20,
        "can_use_manual_drawio": True,
        "can_generate_srs": False,
        "can_generate_ai_diagrams": False,
        "can_export_srs": False,
        "can_export_diagrams": False,
        "is_active": True,
    },
    {
        "code": "individual_pro",
        "name": "Individual Pro",
        "description": "Paid plan for personal AI generation and exports.",
        "workspace_type": "personal",
        "price_cents_monthly": 1900,
        "max_projects": 50,
        "max_members": 1,
        "monthly_srs_generations": 100,
        "monthly_ai_diagram_generations": 50,
        "monthly_manual_diagram_saves": 500,
        "can_use_manual_drawio": True,
        "can_generate_srs": True,
        "can_generate_ai_diagrams": True,
        "can_export_srs": True,
        "can_export_diagrams": True,
        "is_active": True,
    },
    {
        "code": "team",
        "name": "Team",
        "description": "Shared workspace plan for organizations.",
        "workspace_type": "organization",
        "price_cents_monthly": 4900,
        "max_projects": 100,
        "max_members": 10,
        "monthly_srs_generations": 500,
        "monthly_ai_diagram_generations": 200,
        "monthly_manual_diagram_saves": 1000,
        "can_use_manual_drawio": True,
        "can_generate_srs": True,
        "can_generate_ai_diagrams": True,
        "can_export_srs": True,
        "can_export_diagrams": True,
        "is_active": True,
    },
    {
        "code": "enterprise",
        "name": "Enterprise",
        "description": "High-limit organization plan.",
        "workspace_type": "organization",
        "price_cents_monthly": 19900,
        "max_projects": 100000,
        "max_members": 100000,
        "monthly_srs_generations": 100000,
        "monthly_ai_diagram_generations": 100000,
        "monthly_manual_diagram_saves": 100000,
        "can_use_manual_drawio": True,
        "can_generate_srs": True,
        "can_generate_ai_diagrams": True,
        "can_export_srs": True,
        "can_export_diagrams": True,
        "is_active": True,
    },
]

FEATURE_TO_PLAN_FLAG = {
    "manual_drawio": "can_use_manual_drawio",
    "manual_diagram_save": "can_use_manual_drawio",
    "srs_generation": "can_generate_srs",
    "ai_diagram_generation": "can_generate_ai_diagrams",
    "export_srs": "can_export_srs",
    "export_diagrams": "can_export_diagrams",
}

FEATURE_TO_USAGE = {
    "srs_generation": ("srs_generations", "monthly_srs_generations"),
    "ai_diagram_generation": ("ai_diagram_generations", "monthly_ai_diagram_generations"),
    "manual_diagram_save": ("manual_diagram_saves", "monthly_manual_diagram_saves"),
}


class BillingError(Exception):
    """Base class for expected billing failures."""


class BillingFeatureBlockedError(BillingError):
    pass


class BillingLimitExceededError(BillingError):
    pass


class PlanNotFoundError(BillingError):
    pass


@dataclass(frozen=True)
class CheckoutSession:
    checkout_session_id: str
    checkout_url: str
    plan: Plan
    subscription: Subscription


def _period_key(today: date | None = None) -> str:
    current = today or datetime.now(UTC).date()
    return f"{current.year:04d}-{current.month:02d}"


def _period_start(today: date | None = None) -> date:
    current = today or datetime.now(UTC).date()
    return date(current.year, current.month, 1)


def _period_end(today: date | None = None) -> date:
    start = _period_start(today)
    if start.month == 12:
        next_month = date(start.year + 1, 1, 1)
    else:
        next_month = date(start.year, start.month + 1, 1)
    return next_month - timedelta(days=1)


def seed_default_plans(db: Session) -> None:
    changed = False
    for plan_data in DEFAULT_PLANS:
        existing = db.scalar(select(Plan).where(Plan.code == plan_data["code"]))
        if existing is None:
            db.add(Plan(**plan_data))
            changed = True
    if changed:
        db.commit()


def list_active_plans(db: Session) -> list[Plan]:
    seed_default_plans(db)
    return list(
        db.scalars(
            select(Plan).where(Plan.is_active.is_(True)).order_by(Plan.price_cents_monthly.asc())
        )
    )


def get_plan_by_code(db: Session, *, plan_code: str) -> Plan:
    seed_default_plans(db)
    plan = db.scalar(select(Plan).where(Plan.code == plan_code, Plan.is_active.is_(True)))
    if plan is None:
        raise PlanNotFoundError("Plan not found")
    return plan


def _default_plan_code_for_workspace(workspace: Workspace) -> str:
    return "team" if workspace.type == "organization" else "free_individual"


def get_or_create_subscription(db: Session, *, workspace_id: UUID) -> Subscription:
    seed_default_plans(db)
    subscription = db.scalar(
        select(Subscription)
        .options(selectinload(Subscription.plan))
        .where(Subscription.workspace_id == workspace_id)
    )
    if subscription is not None:
        return subscription

    workspace = db.get(Workspace, workspace_id)
    if workspace is None:
        raise BillingFeatureBlockedError("Workspace not found")

    plan = get_plan_by_code(db, plan_code=_default_plan_code_for_workspace(workspace))
    subscription = Subscription(
        workspace_id=workspace_id,
        plan_id=plan.id,
        status="active",
        current_period_start=_period_start(),
        current_period_end=_period_end(),
    )
    db.add(subscription)
    db.commit()
    return db.scalar(
        select(Subscription)
        .options(selectinload(Subscription.plan))
        .where(Subscription.id == subscription.id)
    )


def get_or_create_usage_counter(db: Session, *, workspace_id: UUID) -> UsageCounter:
    period = _period_key()
    counter = db.scalar(
        select(UsageCounter).where(
            UsageCounter.workspace_id == workspace_id,
            UsageCounter.period_key == period,
        )
    )
    if counter is not None:
        return counter

    counter = UsageCounter(workspace_id=workspace_id, period_key=period)
    db.add(counter)
    db.commit()
    db.refresh(counter)
    return counter


def require_feature_access(db: Session, *, workspace_id: UUID, feature: str) -> Subscription:
    subscription = get_or_create_subscription(db, workspace_id=workspace_id)
    if subscription.status != "active":
        raise BillingFeatureBlockedError("Workspace subscription is not active")

    flag_name = FEATURE_TO_PLAN_FLAG.get(feature)
    if flag_name is None:
        raise BillingFeatureBlockedError("Unknown feature")
    if not bool(getattr(subscription.plan, flag_name)):
        raise BillingFeatureBlockedError("Current plan does not allow this feature")
    return subscription


def record_feature_usage(db: Session, *, workspace_id: UUID, feature: str) -> UsageCounter:
    subscription = require_feature_access(db, workspace_id=workspace_id, feature=feature)
    usage_mapping = FEATURE_TO_USAGE.get(feature)
    if usage_mapping is None:
        return get_or_create_usage_counter(db, workspace_id=workspace_id)

    usage_attr, plan_limit_attr = usage_mapping
    counter = get_or_create_usage_counter(db, workspace_id=workspace_id)
    current_count = int(getattr(counter, usage_attr))
    monthly_limit = int(getattr(subscription.plan, plan_limit_attr))
    if monthly_limit >= 0 and current_count >= monthly_limit:
        raise BillingLimitExceededError("Monthly usage limit exceeded")

    setattr(counter, usage_attr, current_count + 1)
    db.commit()
    db.refresh(counter)
    return counter


def require_member_capacity(db: Session, *, workspace_id: UUID) -> None:
    subscription = get_or_create_subscription(db, workspace_id=workspace_id)
    active_member_count = db.scalar(
        select(func.count())
        .select_from(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.status == "active",
        )
    )
    if int(active_member_count or 0) >= subscription.plan.max_members:
        raise BillingLimitExceededError("Workspace member limit exceeded")

def require_project_capacity(db: Session, *, workspace_id: UUID) -> None:
    subscription = get_or_create_subscription(db, workspace_id=workspace_id)
    active_project_count = db.scalar(
        select(func.count())
        .select_from(Project)
        .where(
            Project.workspace_id == workspace_id,
            Project.status == "active",
        )
    )
    if int(active_project_count or 0) >= subscription.plan.max_projects:
        raise BillingLimitExceededError("Workspace project limit exceeded")

def create_checkout_session(db: Session, *, workspace_id: UUID, plan_code: str) -> CheckoutSession:
    plan = get_plan_by_code(db, plan_code=plan_code)
    subscription = get_or_create_subscription(db, workspace_id=workspace_id)
    subscription.plan_id = plan.id
    subscription.status = "active"
    subscription.current_period_start = _period_start()
    subscription.current_period_end = _period_end()
    db.commit()
    subscription = db.scalar(
        select(Subscription)
        .options(selectinload(Subscription.plan))
        .where(Subscription.id == subscription.id)
    )
    session_id = f"checkout_{uuid.uuid4().hex}"
    return CheckoutSession(
        checkout_session_id=session_id,
        checkout_url=f"https://billing.local/checkout/{session_id}",
        plan=plan,
        subscription=subscription,
    )
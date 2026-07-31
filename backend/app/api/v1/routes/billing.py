from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_workspace_membership, get_db
from app.db.models import Plan, Subscription, UsageCounter, WorkspaceMember
from app.schemas.billing import CheckoutRequest, CheckoutResponse, PlanRead, SubscriptionRead, UsageRead
from app.services.billing_service import (
    BillingError,
    PlanNotFoundError,
    create_checkout_session,
    get_or_create_subscription,
    get_or_create_usage_counter,
    list_active_plans,
)

plans_router = APIRouter(prefix="/billing", tags=["billing"])
workspace_billing_router = APIRouter(
    prefix="/workspaces/{workspace_id}/billing",
    tags=["billing"],
)


@plans_router.get("/plans", response_model=list[PlanRead])
def list_plans(db: Session = Depends(get_db)) -> list[Plan]:
    return list_active_plans(db)


@workspace_billing_router.get("/subscription", response_model=SubscriptionRead)
def get_subscription(
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> Subscription:
    return get_or_create_subscription(db, workspace_id=membership.workspace_id)


@workspace_billing_router.get("/usage", response_model=UsageRead)
def get_usage(
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> UsageCounter:
    return get_or_create_usage_counter(db, workspace_id=membership.workspace_id)


@workspace_billing_router.post("/checkout", response_model=CheckoutResponse)
def checkout(
    payload: CheckoutRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> CheckoutResponse:
    try:
        session = create_checkout_session(
            db, workspace_id=membership.workspace_id, plan_code=payload.plan_code
        )
    except PlanNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except BillingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    return CheckoutResponse(
        checkout_session_id=session.checkout_session_id,
        checkout_url=session.checkout_url,
        plan=session.plan,
        subscription=session.subscription,
    )

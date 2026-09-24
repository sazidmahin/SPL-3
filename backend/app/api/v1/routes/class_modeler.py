from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_workspace_membership, get_db
from app.db.models import WorkspaceMember
from app.services.ai_settings_service import AiSettingsError
from app.services.billing_service import BillingError
from app.services.class_modeler_service import ClassModelerError, generate_class_model_from_text
from app.services.llm_service import LlmConfigurationError, LlmExecutionError
from app.services.project_service import ProjectNotFoundError
from app.services.workspace_service import WorkspacePermissionError

router = APIRouter(prefix="/workspaces/{workspace_id}/class-modeler", tags=["class-modeler"])


class ClassModelerRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    mode: Literal["rule_based", "llm"] = "rule_based"
    project_id: UUID | None = None


@router.post("/generate")
def generate_class_model_route(
    payload: ClassModelerRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        return generate_class_model_from_text(
            db, membership=membership, text=payload.text, mode=payload.mode, project_id=payload.project_id
        )
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ProjectNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except LlmExecutionError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI provider call failed: {exc}") from exc
    except (ClassModelerError, BillingError, AiSettingsError, LlmConfigurationError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc

from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_workspace_membership, get_db
from app.db.models import WorkspaceMember
from app.services.ai_settings_service import AiSettingsError
from app.services.class_modeler_service import ClassModelerError, generate_class_model_from_text, ollama_status
from app.services.llm_service import LlmConfigurationError, LlmExecutionError
from app.services.project_service import ProjectNotFoundError
from app.services.workspace_service import WorkspacePermissionError

router = APIRouter(prefix="/workspaces/{workspace_id}/class-modeler", tags=["class-modeler"])


class ClassModelerRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    mode: Literal["rule_based", "llm"] = "rule_based"
    project_id: UUID | None = None
    llm_provider: Literal["ollama", "byok"] | None = None
    model_name: str | None = Field(default=None, max_length=128)


@router.post("/generate")
def generate_class_model_route(
    payload: ClassModelerRequest,
    membership: WorkspaceMember = Depends(get_current_workspace_membership),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        return generate_class_model_from_text(
            db,
            membership=membership,
            text=payload.text,
            mode=payload.mode,
            project_id=payload.project_id,
            llm_provider=payload.llm_provider,
            model_name=payload.model_name,
        )
    except WorkspacePermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ProjectNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except LlmExecutionError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI provider call failed: {exc}") from exc
    except (ClassModelerError, AiSettingsError, LlmConfigurationError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc


@router.get("/ollama-models")
def list_ollama_models(membership: WorkspaceMember = Depends(get_current_workspace_membership)) -> dict[str, Any]:
    """Installed local Ollama models for the LLM engine's model picker."""
    del membership
    return ollama_status()

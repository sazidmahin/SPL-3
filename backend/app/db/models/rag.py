import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class GenerationCorrection(Base):
    """A record of a user correcting an LLM-generated pipeline stage.

    Captured automatically whenever a user saves an edited version of an
    AI-authored stage revision (see rag_service.capture_correction). Used to
    retrieve similar past mistakes at generation time and steer the model away
    from repeating them (see rag_service.retrieve_corrections). Persisted here
    so corrections survive a restart; the runtime similarity search itself runs
    over an in-memory index built from these rows (see InMemoryVectorStore).
    """

    __tablename__ = "generation_corrections"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("workspaces.id"), nullable=False, index=True)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("projects.id"), nullable=False, index=True)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("generation_pipeline_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    stage_name: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    generation_mode: Mapped[str] = mapped_column(String(32), nullable=False)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(JSON, nullable=False)
    wrong_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    corrected_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

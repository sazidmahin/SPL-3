import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SrsDocument(Base):
    __tablename__ = "srs_documents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False, index=True
    )
    requirement_input_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("requirement_inputs.id"), nullable=False, index=True
    )
    generation_job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("generation_jobs.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="active", server_default="active", index=True
    )
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    content_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    extracted_requirements: Mapped[list["ExtractedRequirement"]] = relationship(
        back_populates="srs_document"
    )
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_user_id])


class ExtractedRequirement(Base):
    __tablename__ = "extracted_requirements"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False, index=True
    )
    srs_document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("srs_documents.id"), nullable=False, index=True
    )
    requirement_input_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("requirement_inputs.id"), nullable=False, index=True
    )
    generation_job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("generation_jobs.id"), nullable=False, index=True
    )
    requirement_code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    requirement_text: Mapped[str] = mapped_column(Text, nullable=False)
    requirement_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    nfr_subtype: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    source_trace: Mapped[str] = mapped_column(Text, nullable=False)
    extraction_reason: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.8, server_default="0.8")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    srs_document: Mapped[SrsDocument] = relationship(back_populates="extracted_requirements")
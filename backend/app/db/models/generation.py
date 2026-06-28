import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RequirementInput(Base):
    __tablename__ = "requirement_inputs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    project: Mapped["Project"] = relationship(back_populates="requirement_inputs")
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_user_id])
    generation_jobs: Mapped[list["GenerationJob"]] = relationship(
        back_populates="requirement_input"
    )


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

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
    job_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending", server_default="pending", index=True
    )
    progress_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    generate_class_diagram: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")
    diagram_methods: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    result_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="generation_jobs")
    requirement_input: Mapped[RequirementInput] = relationship(back_populates="generation_jobs")
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_user_id])
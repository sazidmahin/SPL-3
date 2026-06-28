import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Diagram(Base):
    __tablename__ = "diagrams"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    diagram_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual", server_default="manual")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active", server_default="active", index=True)
    current_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    project: Mapped["Project"] = relationship(back_populates="diagrams")
    versions: Mapped[list["DiagramVersion"]] = relationship(back_populates="diagram")
    requirement_links: Mapped[list["DiagramRequirementLink"]] = relationship(back_populates="diagram")
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_user_id])


class DiagramVersion(Base):
    __tablename__ = "diagram_versions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False, index=True
    )
    diagram_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("diagrams.id"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    drawio_xml: Mapped[str] = mapped_column(Text, nullable=False)
    diagram_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    diagram: Mapped[Diagram] = relationship(back_populates="versions")
    requirement_links: Mapped[list["DiagramRequirementLink"]] = relationship(back_populates="diagram_version")
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_user_id])


class DiagramRequirementLink(Base):
    __tablename__ = "diagram_requirement_links"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False, index=True
    )
    diagram_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("diagrams.id"), nullable=False, index=True
    )
    diagram_version_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("diagram_versions.id"), nullable=False, index=True
    )
    srs_document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("srs_documents.id"), nullable=False, index=True
    )
    extracted_requirement_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("extracted_requirements.id"), nullable=False, index=True
    )
    requirement_code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    diagram_element_id: Mapped[str] = mapped_column(String(128), nullable=False)
    diagram_element_label: Mapped[str] = mapped_column(String(255), nullable=False)
    link_reason: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.75, server_default="0.75")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    diagram: Mapped[Diagram] = relationship(back_populates="requirement_links")
    diagram_version: Mapped[DiagramVersion] = relationship(back_populates="requirement_links")
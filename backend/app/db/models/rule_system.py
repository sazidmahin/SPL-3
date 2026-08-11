import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RuleProject(Base):
    __tablename__ = "rule_projects"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active", server_default="active")
    dictionary_version_id: Mapped[str] = mapped_column(String(64), nullable=False, default="dict_v1")
    rule_version_id: Mapped[str] = mapped_column(String(64), nullable=False, default="rules_v1")
    created_by: Mapped[str] = mapped_column(String(255), nullable=False, default="system")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    stages: Mapped[list["StageApproval"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class RevisionMixin:
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_by: Mapped[str] = mapped_column(String(255), nullable=False, default="system")
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    parent_version_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="DRAFT")
    dictionary_version_id: Mapped[str] = mapped_column(String(64), nullable=False, default="dict_v1")
    rule_version_id: Mapped[str] = mapped_column(String(64), nullable=False, default="rules_v1")


class StoryRevision(RevisionMixin, Base):
    __tablename__ = "rule_story_revisions"

    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str | None] = mapped_column(Text, nullable=True)


class Sentence(Base):
    __tablename__ = "rule_sentences"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    story_revision_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_story_revisions.id"), nullable=False)
    stable_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str] = mapped_column(Text, nullable=False)
    sentence_index: Mapped[int] = mapped_column(Integer, nullable=False)
    start_offset: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    end_offset: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    matched_rule_id: Mapped[str] = mapped_column(String(64), nullable=False)


class Clause(Base):
    __tablename__ = "rule_clauses"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    sentence_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_sentences.id"), nullable=False)
    stable_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str] = mapped_column(Text, nullable=False)
    sentence_index: Mapped[int] = mapped_column(Integer, nullable=False)
    clause_index: Mapped[int] = mapped_column(Integer, nullable=False)
    start_offset: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    end_offset: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    matched_rule_id: Mapped[str] = mapped_column(String(64), nullable=False)


class ExtractedFact(Base):
    __tablename__ = "rule_extracted_facts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    story_revision_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_story_revisions.id"), nullable=False)
    stable_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    source_sentence_id: Mapped[str] = mapped_column(String(64), nullable=False)
    source_clause_id: Mapped[str] = mapped_column(String(64), nullable=False)
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    matched_rule_id: Mapped[str] = mapped_column(String(64), nullable=False)
    extraction_type: Mapped[str] = mapped_column(String(64), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class ClarificationQuestion(Base):
    __tablename__ = "rule_clarification_questions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    story_revision_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("rule_story_revisions.id"), nullable=True)
    source_fact_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    stable_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    source_sentence: Mapped[str | None] = mapped_column(Text, nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    triggered_rule_id: Mapped[str] = mapped_column(String(64), nullable=False)
    related_actor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    related_action: Mapped[str | None] = mapped_column(String(255), nullable=True)
    related_object: Mapped[str | None] = mapped_column(String(255), nullable=True)
    suggested_options: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    answer_mapping: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class ClarificationAnswer(Base):
    __tablename__ = "rule_clarification_answers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_clarification_questions.id"), nullable=False)
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="answered")
    applied_slot: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class FinalStoryRevision(RevisionMixin, Base):
    __tablename__ = "rule_final_story_revisions"

    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class RequirementRevision(RevisionMixin, Base):
    __tablename__ = "rule_requirement_revisions"

    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class Requirement(Base):
    __tablename__ = "rule_requirements"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    revision_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("rule_requirement_revisions.id"), nullable=True)
    requirement_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    requirement_type: Mapped[str] = mapped_column(String(32), nullable=False)
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class ClassModelRevision(RevisionMixin, Base):
    __tablename__ = "rule_class_model_revisions"

    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class ClassDefinition(Base):
    __tablename__ = "rule_class_definitions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    revision_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("rule_class_model_revisions.id"), nullable=True)
    class_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class AttributeDefinition(Base):
    __tablename__ = "rule_attribute_definitions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    class_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    attribute_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class MethodDefinition(Base):
    __tablename__ = "rule_method_definitions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    class_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    method_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class RelationshipDefinition(Base):
    __tablename__ = "rule_relationship_definitions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    revision_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("rule_class_model_revisions.id"), nullable=True)
    relationship_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    source_class_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    target_class_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    relationship_type: Mapped[str] = mapped_column(String(32), nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class XmlRevision(RevisionMixin, Base):
    __tablename__ = "rule_xml_revisions"

    xml_text: Mapped[str] = mapped_column(Text, nullable=False)
    class_model: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    validation: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    manual_override: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class StageApproval(Base):
    __tablename__ = "rule_stage_approvals"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=False, index=True)
    stage_name: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="DRAFT")
    current_draft_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    approved_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dictionary_version_id: Mapped[str] = mapped_column(String(64), nullable=False, default="dict_v1")
    rule_version_id: Mapped[str] = mapped_column(String(64), nullable=False, default="rules_v1")
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    project: Mapped[RuleProject] = relationship(back_populates="stages")


class DictionaryVersion(Base):
    __tablename__ = "rule_dictionary_versions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    version_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class DictionaryEntry(Base):
    __tablename__ = "rule_dictionary_entries"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    dictionary_name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    version_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[Any] = mapped_column(JSON, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    project_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class RuleVersion(Base):
    __tablename__ = "rule_versions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    version_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class RuleDefinition(Base):
    __tablename__ = "rule_definitions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    rule_id: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    version_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class AuditEvent(Base):
    __tablename__ = "rule_audit_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("rule_projects.id"), nullable=True, index=True)
    actor: Mapped[str] = mapped_column(String(255), nullable=False, default="system")
    entity_type: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    before_value: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    after_value: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

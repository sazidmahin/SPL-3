from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi.encoders import jsonable_encoder
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models.rule_system import (
    AuditEvent,
    ClassDefinition,
    ClassModelRevision,
    DictionaryEntry,
    DictionaryVersion,
    ClarificationAnswer,
    ClarificationQuestion,
    Clause,
    ExtractedFact,
    FinalStoryRevision,
    RelationshipDefinition,
    Requirement,
    RequirementRevision,
    RuleDefinition,
    RuleProject,
    RuleVersion,
    Sentence,
    StageApproval,
    StoryRevision,
    XmlRevision,
)
from app.rule_engine.dictionaries import DICTIONARY_VERSION, dictionary_names, get_dictionary, load_dictionaries
from app.rule_engine.pipeline import (
    RULE_VERSION,
    STAGES,
    analyze_text,
    apply_answers,
    generate_class_model,
    generate_drawio_xml,
    generate_final_story,
    generate_requirements,
    validate_drawio_xml,
)


class RuleSystemError(Exception):
    pass


class RuleNotFoundError(RuleSystemError):
    pass


class RuleInvalidStateError(RuleSystemError):
    pass


def _audit(
    db: Session,
    *,
    project_id: UUID | None,
    entity_type: str,
    entity_id: str | None,
    action: str,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
) -> None:
    db.add(
        AuditEvent(
            project_id=project_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            before_value=jsonable_encoder(before) if before is not None else None,
            after_value=jsonable_encoder(after) if after is not None else None,
        )
    )


def _project(db: Session, project_id: UUID) -> RuleProject:
    project = db.get(RuleProject, project_id)
    if project is None or project.status == "deleted":
        raise RuleNotFoundError("Rule project not found")
    return project


def _next_version(db: Session, model: type, project_id: UUID) -> int:
    versions = db.scalars(select(model.version_number).where(model.project_id == project_id)).all()
    return (max(versions) if versions else 0) + 1


def _latest_revision(db: Session, model: type, project_id: UUID):
    return db.scalar(
        select(model)
        .where(model.project_id == project_id)
        .order_by(model.version_number.desc(), model.created_at.desc())
    )


def _stage(db: Session, project_id: UUID, stage_name: str) -> StageApproval:
    stage = db.scalar(
        select(StageApproval).where(
            StageApproval.project_id == project_id,
            StageApproval.stage_name == stage_name,
        )
    )
    if stage is None:
        stage = StageApproval(project_id=project_id, stage_name=stage_name)
        db.add(stage)
        db.flush()
    return stage


def _set_stage_status(db: Session, project_id: UUID, stage_name: str, status: str, version: int | None = None) -> None:
    stage = _stage(db, project_id, stage_name)
    stage.status = status
    if version is not None:
        stage.current_draft_version = version


def _stale_later(db: Session, project_id: UUID, stage_name: str) -> None:
    if stage_name not in STAGES:
        return
    for later in STAGES[STAGES.index(stage_name) + 1 :]:
        stage = _stage(db, project_id, later)
        if stage.status in {"APPROVED", "READY_FOR_REVIEW"}:
            stage.status = "STALE"


def _stage_payload(stage: StageApproval) -> dict[str, Any]:
    return {
        "stageName": stage.stage_name,
        "status": stage.status,
        "currentDraftVersion": stage.current_draft_version,
        "approvedVersion": stage.approved_version,
        "dictionaryVersionId": stage.dictionary_version_id,
        "ruleVersionId": stage.rule_version_id,
        "approvedAt": stage.approved_at,
        "updatedAt": stage.updated_at,
    }


def project_payload(db: Session, project: RuleProject) -> dict[str, Any]:
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "dictionaryVersionId": project.dictionary_version_id,
        "ruleVersionId": project.rule_version_id,
        "createdBy": project.created_by,
        "createdAt": project.created_at,
        "updatedAt": project.updated_at,
        "stages": list_stages(db, project.id),
    }


def create_rule_project(db: Session, *, name: str, description: str | None = None) -> dict[str, Any]:
    cleaned_name = name.strip()
    if not cleaned_name:
        raise RuleInvalidStateError("Project name is required")
    project = RuleProject(name=cleaned_name, description=description, status="active")
    db.add(project)
    db.flush()
    for stage_name in STAGES:
        db.add(StageApproval(project_id=project.id, stage_name=stage_name, status="DRAFT"))
    _audit(db, project_id=project.id, entity_type="project", entity_id=str(project.id), action="project created")
    db.commit()
    db.refresh(project)
    return project_payload(db, project)


def list_rule_projects(db: Session) -> list[dict[str, Any]]:
    projects = db.scalars(select(RuleProject).where(RuleProject.status != "deleted").order_by(RuleProject.created_at.desc())).all()
    return [project_payload(db, item) for item in projects]


def get_rule_project(db: Session, project_id: UUID) -> dict[str, Any]:
    return project_payload(db, _project(db, project_id))


def update_rule_project(db: Session, project_id: UUID, payload: dict[str, Any]) -> dict[str, Any]:
    project = _project(db, project_id)
    before = project_payload(db, project)
    if "name" in payload and payload["name"] is not None:
        cleaned = payload["name"].strip()
        if not cleaned:
            raise RuleInvalidStateError("Project name is required")
        project.name = cleaned
    if "description" in payload:
        project.description = payload["description"]
    _audit(db, project_id=project.id, entity_type="project", entity_id=str(project.id), action="project edited", before=before)
    db.commit()
    db.refresh(project)
    return project_payload(db, project)


def delete_rule_project(db: Session, project_id: UUID) -> dict[str, str]:
    project = _project(db, project_id)
    project.status = "deleted"
    _audit(db, project_id=project.id, entity_type="project", entity_id=str(project.id), action="project deleted")
    db.commit()
    return {"status": "deleted"}


def create_story_revision(db: Session, project_id: UUID, *, original_text: str) -> dict[str, Any]:
    project = _project(db, project_id)
    version = _next_version(db, StoryRevision, project_id)
    parent = _latest_revision(db, StoryRevision, project_id)
    revision = StoryRevision(
        project_id=project.id,
        version_number=version,
        parent_version_id=parent.id if parent else None,
        status="READY_FOR_REVIEW",
        original_text=original_text,
    )
    db.add(revision)
    _set_stage_status(db, project_id, "input", "READY_FOR_REVIEW", version)
    _stale_later(db, project_id, "input")
    _audit(db, project_id=project.id, entity_type="story_revision", entity_id=None, action="input edited")
    db.commit()
    db.refresh(revision)
    return story_revision_payload(revision)


def story_revision_payload(revision: StoryRevision) -> dict[str, Any]:
    return {
        "id": revision.id,
        "projectId": revision.project_id,
        "versionNumber": revision.version_number,
        "parentVersionId": revision.parent_version_id,
        "status": revision.status,
        "originalText": revision.original_text,
        "normalizedText": revision.normalized_text,
        "dictionaryVersionId": revision.dictionary_version_id,
        "ruleVersionId": revision.rule_version_id,
        "createdAt": revision.created_at,
        "createdBy": revision.created_by,
    }


def list_story_revisions(db: Session, project_id: UUID) -> list[dict[str, Any]]:
    _project(db, project_id)
    revisions = db.scalars(
        select(StoryRevision).where(StoryRevision.project_id == project_id).order_by(StoryRevision.version_number.desc())
    ).all()
    return [story_revision_payload(item) for item in revisions]


def get_story_revision(db: Session, project_id: UUID, revision_id: UUID) -> dict[str, Any]:
    _project(db, project_id)
    revision = db.get(StoryRevision, revision_id)
    if revision is None or revision.project_id != project_id:
        raise RuleNotFoundError("Story revision not found")
    return story_revision_payload(revision)


def run_clarifications(db: Session, project_id: UUID) -> dict[str, Any]:
    _project(db, project_id)
    story = _latest_revision(db, StoryRevision, project_id)
    if story is None:
        raise RuleInvalidStateError("A story revision is required before running clarifications")
    analysis = analyze_text(story.original_text)
    story.normalized_text = analysis["normalization"]["normalizedText"]

    db.execute(delete(Sentence).where(Sentence.project_id == project_id, Sentence.story_revision_id == story.id))
    db.execute(delete(Clause).where(Clause.project_id == project_id))
    db.execute(delete(ExtractedFact).where(ExtractedFact.project_id == project_id, ExtractedFact.story_revision_id == story.id))
    db.execute(delete(ClarificationQuestion).where(ClarificationQuestion.project_id == project_id, ClarificationQuestion.story_revision_id == story.id))

    sentence_rows: dict[str, Sentence] = {}
    for sentence in analysis["sentences"]:
        row = Sentence(
            project_id=project_id,
            story_revision_id=story.id,
            stable_id=sentence["id"],
            text=sentence["text"],
            normalized_text=sentence["normalizedText"],
            sentence_index=sentence["sentenceIndex"],
            start_offset=sentence["startOffset"],
            end_offset=sentence["endOffset"],
            matched_rule_id=sentence["matchedRuleId"],
        )
        db.add(row)
        db.flush()
        sentence_rows[sentence["id"]] = row
    for clause in analysis["clauses"]:
        db.add(
            Clause(
                project_id=project_id,
                sentence_id=sentence_rows[clause["sentenceId"]].id,
                stable_id=clause["id"],
                text=clause["text"],
                normalized_text=clause["normalizedText"],
                sentence_index=clause["sentenceIndex"],
                clause_index=clause["clauseIndex"],
                start_offset=max(clause["startOffset"], 0),
                end_offset=max(clause["endOffset"], 0),
                matched_rule_id=clause["matchedRuleId"],
            )
        )
    for fact in analysis["facts"]:
        db.add(
            ExtractedFact(
                project_id=project_id,
                story_revision_id=story.id,
                stable_id=fact["id"],
                source_sentence_id=fact["sourceSentenceId"],
                source_clause_id=fact["sourceClauseId"],
                source_text=fact["sourceText"],
                data=fact,
                matched_rule_id=fact["matchedRuleId"],
                extraction_type=fact["extractionType"],
            )
        )
    for question in analysis["clarificationQuestions"]:
        db.add(
            ClarificationQuestion(
                project_id=project_id,
                story_revision_id=story.id,
                source_fact_id=question["sourceFactId"],
                stable_id=question["id"],
                text=question["text"],
                source_sentence=question["sourceSentence"],
                reason=question["reason"],
                triggered_rule_id=question["triggeredRuleId"],
                related_actor=question["relatedActor"],
                related_action=question["relatedAction"],
                related_object=question["relatedObject"],
                suggested_options=question["suggestedOptions"],
                answer_mapping=question["answerMapping"],
            )
        )
    _set_stage_status(db, project_id, "clarifications", "READY_FOR_REVIEW", story.version_number)
    _stale_later(db, project_id, "clarifications")
    _audit(db, project_id=project_id, entity_type="analysis", entity_id=str(story.id), action="analysis executed", after=analysis)
    db.commit()
    return {
        "storyRevision": story_revision_payload(story),
        "sentences": analysis["sentences"],
        "clauses": analysis["clauses"],
        "facts": analysis["facts"],
        "clarificationQuestions": list_clarifications(db, project_id),
    }


def clarification_payload(question: ClarificationQuestion) -> dict[str, Any]:
    return {
        "id": question.stable_id,
        "databaseId": question.id,
        "projectId": question.project_id,
        "questionText": question.text,
        "sourceSentence": question.source_sentence,
        "reason": question.reason,
        "triggeredRuleId": question.triggered_rule_id,
        "relatedActor": question.related_actor,
        "relatedAction": question.related_action,
        "relatedObject": question.related_object,
        "suggestedOptions": question.suggested_options,
        "status": question.status,
        "sourceFactId": question.source_fact_id,
        "answerMapping": question.answer_mapping,
        "createdAt": question.created_at,
        "updatedAt": question.updated_at,
    }


def list_clarifications(db: Session, project_id: UUID) -> list[dict[str, Any]]:
    _project(db, project_id)
    questions = db.scalars(
        select(ClarificationQuestion)
        .where(ClarificationQuestion.project_id == project_id)
        .order_by(ClarificationQuestion.stable_id.asc())
    ).all()
    return [clarification_payload(item) for item in questions]


def _question_by_stable_id(db: Session, project_id: UUID, question_id: str) -> ClarificationQuestion:
    question = db.scalar(
        select(ClarificationQuestion).where(
            ClarificationQuestion.project_id == project_id,
            ClarificationQuestion.stable_id == question_id,
        )
    )
    if question is None:
        raise RuleNotFoundError("Clarification question not found")
    return question


def patch_clarification(db: Session, project_id: UUID, question_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    question = _question_by_stable_id(db, project_id, question_id)
    before = clarification_payload(question)
    if "questionText" in payload and payload["questionText"] is not None:
        question.text = payload["questionText"]
    if "status" in payload and payload["status"] is not None:
        question.status = payload["status"]
    if "suggestedOptions" in payload and payload["suggestedOptions"] is not None:
        question.suggested_options = payload["suggestedOptions"]
    _stale_later(db, project_id, "clarifications")
    _audit(db, project_id=project_id, entity_type="clarification_question", entity_id=question_id, action="question edited", before=before)
    db.commit()
    db.refresh(question)
    return clarification_payload(question)


def answer_clarification(db: Session, project_id: UUID, question_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    question = _question_by_stable_id(db, project_id, question_id)
    answer = db.scalar(
        select(ClarificationAnswer).where(
            ClarificationAnswer.project_id == project_id,
            ClarificationAnswer.question_id == question.id,
        )
    )
    if answer is None:
        answer = ClarificationAnswer(project_id=project_id, question_id=question.id)
        db.add(answer)
    before = {"answerText": answer.answer_text, "status": answer.status, "appliedSlot": answer.applied_slot}
    answer.answer_text = payload.get("answerText")
    answer.status = payload.get("status") or "answered"
    answer.applied_slot = payload.get("appliedSlot") or question.answer_mapping
    question.status = "answered" if answer.status == "answered" else answer.status
    _stale_later(db, project_id, "clarifications")
    _audit(db, project_id=project_id, entity_type="clarification_answer", entity_id=question_id, action="answer added", before=before)
    db.commit()
    db.refresh(answer)
    return answer_payload(answer, question)


def answer_payload(answer: ClarificationAnswer, question: ClarificationQuestion) -> dict[str, Any]:
    return {
        "id": answer.id,
        "projectId": answer.project_id,
        "questionId": question.stable_id,
        "answerText": answer.answer_text,
        "status": answer.status,
        "appliedSlot": answer.applied_slot,
        "createdAt": answer.created_at,
        "updatedAt": answer.updated_at,
    }


def add_manual_clarification(db: Session, project_id: UUID, payload: dict[str, Any]) -> dict[str, Any]:
    _project(db, project_id)
    count = len(db.scalars(select(ClarificationQuestion).where(ClarificationQuestion.project_id == project_id)).all())
    stable_id = payload.get("id") or f"CLR-MANUAL-{count + 1:03d}"
    question = ClarificationQuestion(
        project_id=project_id,
        stable_id=stable_id,
        text=payload["questionText"],
        source_sentence=payload.get("sourceSentence"),
        reason=payload.get("reason") or "Manual question.",
        triggered_rule_id="CLR_MANUAL_QUESTION_001",
        related_actor=payload.get("relatedActor"),
        related_action=payload.get("relatedAction"),
        related_object=payload.get("relatedObject"),
        suggested_options=payload.get("suggestedOptions") or [],
        answer_mapping=payload.get("answerMapping"),
    )
    db.add(question)
    _audit(db, project_id=project_id, entity_type="clarification_question", entity_id=stable_id, action="question generated")
    db.commit()
    db.refresh(question)
    return clarification_payload(question)


def _facts_for_latest_story(db: Session, project_id: UUID) -> list[dict[str, Any]]:
    story = _latest_revision(db, StoryRevision, project_id)
    if story is None:
        return []
    rows = db.scalars(
        select(ExtractedFact)
        .where(ExtractedFact.project_id == project_id, ExtractedFact.story_revision_id == story.id, ExtractedFact.enabled.is_(True))
        .order_by(ExtractedFact.stable_id.asc())
    ).all()
    return [row.data for row in rows]


def _answers_with_questions(db: Session, project_id: UUID) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    questions = db.scalars(select(ClarificationQuestion).where(ClarificationQuestion.project_id == project_id)).all()
    question_lookup = {question.stable_id: clarification_payload(question) for question in questions}
    answers = []
    for question in questions:
        answer = db.scalar(
            select(ClarificationAnswer).where(
                ClarificationAnswer.project_id == project_id,
                ClarificationAnswer.question_id == question.id,
            )
        )
        if answer:
            answers.append(
                {
                    "questionStableId": question.stable_id,
                    "answerText": answer.answer_text,
                    "status": answer.status,
                    "appliedSlot": answer.applied_slot,
                    "createdAt": answer.created_at.isoformat() if answer.created_at else "",
                }
            )
    return answers, question_lookup


def run_final_story(db: Session, project_id: UUID) -> dict[str, Any]:
    _project(db, project_id)
    story = _latest_revision(db, StoryRevision, project_id)
    if story is None:
        raise RuleInvalidStateError("A story revision is required before running final story")
    facts = _facts_for_latest_story(db, project_id)
    answers, question_lookup = _answers_with_questions(db, project_id)
    merged = apply_answers(facts, answers, question_lookup)
    final = generate_final_story(story.original_text, split_normalized_sentences(story), merged, answers)
    version = _next_version(db, FinalStoryRevision, project_id)
    parent = _latest_revision(db, FinalStoryRevision, project_id)
    revision = FinalStoryRevision(
        project_id=project_id,
        version_number=version,
        parent_version_id=parent.id if parent else None,
        status="READY_FOR_REVIEW",
        data=final,
    )
    db.add(revision)
    _set_stage_status(db, project_id, "final-story", "READY_FOR_REVIEW", version)
    _stale_later(db, project_id, "final-story")
    _audit(db, project_id=project_id, entity_type="final_story_revision", entity_id=None, action="final story generated", after=final)
    db.commit()
    db.refresh(revision)
    return final_story_payload(revision)


def split_normalized_sentences(story: StoryRevision) -> list[dict[str, Any]]:
    return analyze_text(story.original_text)["sentences"]


def final_story_payload(revision: FinalStoryRevision) -> dict[str, Any]:
    return {
        "id": revision.id,
        "projectId": revision.project_id,
        "versionNumber": revision.version_number,
        "status": revision.status,
        "data": revision.data,
        "dictionaryVersionId": revision.dictionary_version_id,
        "ruleVersionId": revision.rule_version_id,
        "createdAt": revision.created_at,
    }


def get_final_story(db: Session, project_id: UUID) -> dict[str, Any]:
    revision = _latest_revision(db, FinalStoryRevision, project_id)
    if revision is None:
        raise RuleNotFoundError("Final story not found")
    return final_story_payload(revision)


def patch_final_story_section(db: Session, project_id: UUID, section_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    revision = _latest_revision(db, FinalStoryRevision, project_id)
    if revision is None:
        raise RuleNotFoundError("Final story not found")
    data = dict(revision.data)
    sections = [dict(item) for item in data.get("atomicStorySections", [])]
    found = False
    for section in sections:
        if section["id"] == section_id:
            section.update(payload)
            found = True
            break
    if not found:
        raise RuleNotFoundError("Final story section not found")
    data["atomicStorySections"] = sections
    revision.data = data
    revision.status = "READY_FOR_REVIEW"
    _stale_later(db, project_id, "final-story")
    db.commit()
    db.refresh(revision)
    return final_story_payload(revision)


def run_requirements(db: Session, project_id: UUID) -> dict[str, Any]:
    final_story = _latest_revision(db, FinalStoryRevision, project_id)
    if final_story is None:
        raise RuleInvalidStateError("Final story is required before running requirements")
    facts = _facts_for_latest_story(db, project_id)
    req_data = generate_requirements(final_story.data, facts)
    version = _next_version(db, RequirementRevision, project_id)
    parent = _latest_revision(db, RequirementRevision, project_id)
    revision = RequirementRevision(
        project_id=project_id,
        version_number=version,
        parent_version_id=parent.id if parent else None,
        status="READY_FOR_REVIEW",
        data=req_data,
    )
    db.add(revision)
    db.flush()
    db.execute(delete(Requirement).where(Requirement.project_id == project_id))
    for item in req_data["requirements"]:
        db.add(
            Requirement(
                project_id=project_id,
                revision_id=revision.id,
                requirement_id=item["requirementId"],
                requirement_type=item["requirementType"],
                statement=item["statement"],
                data=item,
                enabled=item.get("enabled", True),
            )
        )
    _set_stage_status(db, project_id, "requirements", "READY_FOR_REVIEW", version)
    _stale_later(db, project_id, "requirements")
    _audit(db, project_id=project_id, entity_type="requirement_revision", entity_id=str(revision.id), action="requirements generated", after=req_data)
    db.commit()
    db.refresh(revision)
    return requirement_revision_payload(revision)


def requirement_revision_payload(revision: RequirementRevision) -> dict[str, Any]:
    return {
        "id": revision.id,
        "projectId": revision.project_id,
        "versionNumber": revision.version_number,
        "status": revision.status,
        "requirements": revision.data.get("requirements", []),
        "dictionaryVersionId": revision.dictionary_version_id,
        "ruleVersionId": revision.rule_version_id,
        "createdAt": revision.created_at,
    }


def list_requirements(db: Session, project_id: UUID) -> dict[str, Any]:
    revision = _latest_revision(db, RequirementRevision, project_id)
    if revision is None:
        raise RuleNotFoundError("Requirements not found")
    return requirement_revision_payload(revision)


def add_requirement(db: Session, project_id: UUID, payload: dict[str, Any]) -> dict[str, Any]:
    revision = _latest_revision(db, RequirementRevision, project_id)
    if revision is None:
        raise RuleInvalidStateError("Run requirements before adding a manual requirement")
    data = dict(revision.data)
    requirements = list(data.get("requirements", []))
    requirement_id = payload.get("requirementId") or f"MANUAL-{len(requirements) + 1:03d}"
    item = {"requirementId": requirement_id, "id": requirement_id, "enabled": True, "matchedRuleId": "FR_MANUAL_REQUIREMENT_001", **payload}
    requirements.append(item)
    data["requirements"] = requirements
    revision.data = data
    db.add(
        Requirement(
            project_id=project_id,
            revision_id=revision.id,
            requirement_id=requirement_id,
            requirement_type=item.get("requirementType", "functional"),
            statement=item["statement"],
            data=item,
            enabled=item.get("enabled", True),
        )
    )
    _stale_later(db, project_id, "requirements")
    db.commit()
    return item


def patch_requirement(db: Session, project_id: UUID, requirement_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    requirement = db.scalar(select(Requirement).where(Requirement.project_id == project_id, Requirement.requirement_id == requirement_id))
    if requirement is None:
        raise RuleNotFoundError("Requirement not found")
    data = dict(requirement.data)
    data.update(payload)
    if "statement" in payload:
        requirement.statement = payload["statement"]
    if "requirementType" in payload:
        requirement.requirement_type = payload["requirementType"]
    if "enabled" in payload:
        requirement.enabled = payload["enabled"]
    requirement.data = data
    _stale_later(db, project_id, "requirements")
    db.commit()
    db.refresh(requirement)
    return requirement.data


def delete_requirement(db: Session, project_id: UUID, requirement_id: str) -> dict[str, str]:
    requirement = db.scalar(select(Requirement).where(Requirement.project_id == project_id, Requirement.requirement_id == requirement_id))
    if requirement is None:
        raise RuleNotFoundError("Requirement not found")
    db.delete(requirement)
    _stale_later(db, project_id, "requirements")
    db.commit()
    return {"status": "deleted"}


def _current_requirements(db: Session, project_id: UUID) -> list[dict[str, Any]]:
    rows = db.scalars(select(Requirement).where(Requirement.project_id == project_id).order_by(Requirement.requirement_id.asc())).all()
    if rows:
        return [row.data for row in rows]
    revision = _latest_revision(db, RequirementRevision, project_id)
    return revision.data.get("requirements", []) if revision else []


def run_class_model(db: Session, project_id: UUID) -> dict[str, Any]:
    requirements = _current_requirements(db, project_id)
    if not requirements:
        raise RuleInvalidStateError("Requirements are required before running class model")
    facts = _facts_for_latest_story(db, project_id)
    model = generate_class_model(requirements, facts)
    version = _next_version(db, ClassModelRevision, project_id)
    parent = _latest_revision(db, ClassModelRevision, project_id)
    revision = ClassModelRevision(
        project_id=project_id,
        version_number=version,
        parent_version_id=parent.id if parent else None,
        status="READY_FOR_REVIEW",
        data=model,
    )
    db.add(revision)
    db.flush()
    db.execute(delete(ClassDefinition).where(ClassDefinition.project_id == project_id))
    db.execute(delete(RelationshipDefinition).where(RelationshipDefinition.project_id == project_id))
    for cls in model["classes"]:
        db.add(ClassDefinition(project_id=project_id, revision_id=revision.id, class_id=cls["id"], name=cls["name"], data=cls))
    for rel in model["relationships"]:
        db.add(
            RelationshipDefinition(
                project_id=project_id,
                revision_id=revision.id,
                relationship_id=rel["id"],
                source_class_id=rel["sourceClassId"],
                target_class_id=rel["targetClassId"],
                relationship_type=rel["type"],
                data=rel,
            )
        )
    _set_stage_status(db, project_id, "class-model", "READY_FOR_REVIEW", version)
    _stale_later(db, project_id, "class-model")
    _audit(db, project_id=project_id, entity_type="class_model_revision", entity_id=str(revision.id), action="class model generated", after=model)
    db.commit()
    db.refresh(revision)
    return class_model_payload(revision)


def class_model_payload(revision: ClassModelRevision) -> dict[str, Any]:
    return {
        "id": revision.id,
        "projectId": revision.project_id,
        "versionNumber": revision.version_number,
        "status": revision.status,
        "classModel": revision.data,
        "dictionaryVersionId": revision.dictionary_version_id,
        "ruleVersionId": revision.rule_version_id,
        "createdAt": revision.created_at,
    }


def get_class_model(db: Session, project_id: UUID) -> dict[str, Any]:
    revision = _latest_revision(db, ClassModelRevision, project_id)
    if revision is None:
        raise RuleNotFoundError("Class model not found")
    return class_model_payload(revision)


def _update_current_class_model(db: Session, project_id: UUID, updater) -> dict[str, Any]:
    revision = _latest_revision(db, ClassModelRevision, project_id)
    if revision is None:
        raise RuleNotFoundError("Class model not found")
    data = dict(revision.data)
    updater(data)
    revision.data = data
    revision.status = "READY_FOR_REVIEW"
    _stale_later(db, project_id, "class-model")
    db.commit()
    db.refresh(revision)
    return class_model_payload(revision)


def add_class(db: Session, project_id: UUID, payload: dict[str, Any]) -> dict[str, Any]:
    def updater(data: dict[str, Any]) -> None:
        class_id = payload.get("id") or f"class_{payload['name'].strip().lower().replace(' ', '_')}"
        data.setdefault("classes", []).append(
            {
                "id": class_id,
                "name": payload["name"],
                "stereotype": payload.get("stereotype", "entity"),
                "attributes": payload.get("attributes", []),
                "methods": payload.get("methods", []),
                "sourceFactIds": payload.get("sourceFactIds", []),
                "sourceRequirementIds": payload.get("sourceRequirementIds", []),
                "warnings": payload.get("warnings", []),
                "enabled": payload.get("enabled", True),
            }
        )

    return _update_current_class_model(db, project_id, updater)


def patch_class(db: Session, project_id: UUID, class_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    def updater(data: dict[str, Any]) -> None:
        for cls in data.get("classes", []):
            if cls["id"] == class_id:
                cls.update(payload)
                return
        raise RuleNotFoundError("Class not found")

    return _update_current_class_model(db, project_id, updater)


def delete_class(db: Session, project_id: UUID, class_id: str) -> dict[str, Any]:
    def updater(data: dict[str, Any]) -> None:
        data["classes"] = [item for item in data.get("classes", []) if item["id"] != class_id]
        data["relationships"] = [
            item for item in data.get("relationships", []) if item["sourceClassId"] != class_id and item["targetClassId"] != class_id
        ]

    return _update_current_class_model(db, project_id, updater)


def add_relationship(db: Session, project_id: UUID, payload: dict[str, Any]) -> dict[str, Any]:
    def updater(data: dict[str, Any]) -> None:
        rel_id = payload.get("id") or f"edge_{len(data.get('relationships', [])) + 1:03d}"
        data.setdefault("relationships", []).append({"id": rel_id, "enabled": True, "warnings": [], **payload})

    return _update_current_class_model(db, project_id, updater)


def patch_relationship(db: Session, project_id: UUID, relationship_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    def updater(data: dict[str, Any]) -> None:
        for rel in data.get("relationships", []):
            if rel["id"] == relationship_id:
                rel.update(payload)
                return
        raise RuleNotFoundError("Relationship not found")

    return _update_current_class_model(db, project_id, updater)


def delete_relationship(db: Session, project_id: UUID, relationship_id: str) -> dict[str, Any]:
    def updater(data: dict[str, Any]) -> None:
        data["relationships"] = [item for item in data.get("relationships", []) if item["id"] != relationship_id]

    return _update_current_class_model(db, project_id, updater)


def run_xml(db: Session, project_id: UUID) -> dict[str, Any]:
    class_model_revision = _latest_revision(db, ClassModelRevision, project_id)
    if class_model_revision is None:
        raise RuleInvalidStateError("Class model is required before running XML")
    xml_text, validation = generate_drawio_xml(class_model_revision.data)
    if not validation["valid"]:
        raise RuleInvalidStateError("; ".join(validation["errors"]))
    version = _next_version(db, XmlRevision, project_id)
    parent = _latest_revision(db, XmlRevision, project_id)
    revision = XmlRevision(
        project_id=project_id,
        version_number=version,
        parent_version_id=parent.id if parent else None,
        status="READY_FOR_REVIEW",
        xml_text=xml_text,
        class_model=class_model_revision.data,
        validation=validation,
    )
    db.add(revision)
    _set_stage_status(db, project_id, "xml", "READY_FOR_REVIEW", version)
    _audit(db, project_id=project_id, entity_type="xml_revision", entity_id=None, action="XML generated")
    db.commit()
    db.refresh(revision)
    return xml_payload(revision)


def xml_payload(revision: XmlRevision) -> dict[str, Any]:
    return {
        "id": revision.id,
        "projectId": revision.project_id,
        "versionNumber": revision.version_number,
        "status": revision.status,
        "xml": revision.xml_text,
        "classModel": revision.class_model,
        "validation": revision.validation,
        "manualOverride": revision.manual_override,
        "dictionaryVersionId": revision.dictionary_version_id,
        "ruleVersionId": revision.rule_version_id,
        "createdAt": revision.created_at,
    }


def get_xml(db: Session, project_id: UUID) -> dict[str, Any]:
    revision = _latest_revision(db, XmlRevision, project_id)
    if revision is None:
        raise RuleNotFoundError("XML not found")
    return xml_payload(revision)


def save_manual_xml(db: Session, project_id: UUID, xml_text: str) -> dict[str, Any]:
    current = _latest_revision(db, XmlRevision, project_id)
    class_model = current.class_model if current else {}
    validation = validate_drawio_xml(xml_text, class_model or None)
    if not validation["valid"]:
        raise RuleInvalidStateError("; ".join(validation["errors"]))
    version = _next_version(db, XmlRevision, project_id)
    revision = XmlRevision(
        project_id=project_id,
        version_number=version,
        parent_version_id=current.id if current else None,
        status="READY_FOR_REVIEW",
        xml_text=xml_text,
        class_model=class_model,
        validation=validation,
        manual_override=True,
    )
    db.add(revision)
    _set_stage_status(db, project_id, "xml", "READY_FOR_REVIEW", version)
    _audit(db, project_id=project_id, entity_type="xml_revision", entity_id=None, action="XML manually overridden")
    db.commit()
    db.refresh(revision)
    return xml_payload(revision)


def validate_xml_text(db: Session, project_id: UUID, xml_text: str) -> dict[str, Any]:
    current = _latest_revision(db, ClassModelRevision, project_id)
    return validate_drawio_xml(xml_text, current.data if current else None)


def approve_stage(db: Session, project_id: UUID, stage_name: str) -> dict[str, Any]:
    if stage_name not in STAGES:
        raise RuleInvalidStateError("Invalid stage name")
    stage = _stage(db, project_id, stage_name)
    if stage.status == "FAILED":
        raise RuleInvalidStateError("Failed stages must be rerun before approval")
    stage.status = "APPROVED"
    stage.approved_version = stage.current_draft_version
    stage.approved_at = datetime.now(UTC)
    _audit(db, project_id=project_id, entity_type="stage", entity_id=stage_name, action="stage approved")
    db.commit()
    db.refresh(stage)
    return _stage_payload(stage)


def reopen_stage(db: Session, project_id: UUID, stage_name: str) -> dict[str, Any]:
    if stage_name not in STAGES:
        raise RuleInvalidStateError("Invalid stage name")
    stage = _stage(db, project_id, stage_name)
    stage.status = "DRAFT"
    _stale_later(db, project_id, stage_name)
    _audit(db, project_id=project_id, entity_type="stage", entity_id=stage_name, action="stage reopened")
    db.commit()
    db.refresh(stage)
    return _stage_payload(stage)


def list_stages(db: Session, project_id: UUID) -> list[dict[str, Any]]:
    stages = db.scalars(select(StageApproval).where(StageApproval.project_id == project_id)).all()
    by_name = {stage.stage_name: stage for stage in stages}
    for stage_name in STAGES:
        if stage_name not in by_name:
            by_name[stage_name] = _stage(db, project_id, stage_name)
    return [_stage_payload(by_name[name]) for name in STAGES]


def dictionaries_index() -> dict[str, Any]:
    return {"activeVersionId": DICTIONARY_VERSION, "dictionaries": dictionary_names()}


def dictionary_detail(dictionary_name: str) -> dict[str, Any]:
    return {"name": dictionary_name, "versionId": DICTIONARY_VERSION, "entries": get_dictionary(dictionary_name)}


def dictionary_export() -> dict[str, Any]:
    return {"versionId": DICTIONARY_VERSION, "dictionaries": load_dictionaries()}




def dictionary_entry_payload(entry: DictionaryEntry) -> dict[str, Any]:
    return {
        "id": entry.id,
        "dictionaryName": entry.dictionary_name,
        "versionId": entry.version_id,
        "key": entry.key,
        "value": entry.value,
        "priority": entry.priority,
        "enabled": entry.enabled,
        "projectId": entry.project_id,
        "createdAt": entry.created_at,
        "updatedAt": entry.updated_at,
    }


def create_dictionary_entry(db: Session, dictionary_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    key = str(payload.get("key") or "").strip()
    if not key:
        raise RuleInvalidStateError("Dictionary entry key is required")
    entry = DictionaryEntry(
        dictionary_name=dictionary_name,
        version_id=str(payload.get("versionId") or DICTIONARY_VERSION),
        key=key,
        value=payload.get("value", payload),
        priority=int(payload.get("priority", 100)),
        enabled=bool(payload.get("enabled", True)),
        project_id=payload.get("projectId"),
    )
    db.add(entry)
    _audit(db, project_id=entry.project_id, entity_type="dictionary_entry", entity_id=key, action="dictionary entry added", after=payload)
    db.commit()
    db.refresh(entry)
    return dictionary_entry_payload(entry)


def update_dictionary_entry(db: Session, dictionary_name: str, entry_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    entry = None
    try:
        entry = db.get(DictionaryEntry, UUID(entry_id))
    except ValueError:
        entry = db.scalar(
            select(DictionaryEntry).where(
                DictionaryEntry.dictionary_name == dictionary_name,
                DictionaryEntry.key == entry_id,
            )
        )
    if entry is None or entry.dictionary_name != dictionary_name:
        raise RuleNotFoundError("Dictionary entry not found")
    before = dictionary_entry_payload(entry)
    if "key" in payload:
        entry.key = str(payload["key"])
    if "value" in payload:
        entry.value = payload["value"]
    if "priority" in payload:
        entry.priority = int(payload["priority"])
    if "enabled" in payload:
        entry.enabled = bool(payload["enabled"])
    _audit(db, project_id=entry.project_id, entity_type="dictionary_entry", entity_id=str(entry.id), action="dictionary entry edited", before=before, after=payload)
    db.commit()
    db.refresh(entry)
    return dictionary_entry_payload(entry)


def create_dictionary_version_record(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    version_id = str(payload.get("versionId") or payload.get("version_id") or f"dict_custom_{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}")
    version = DictionaryVersion(version_id=version_id, status="draft", data=payload.get("dictionaries", payload))
    db.add(version)
    _audit(db, project_id=None, entity_type="dictionary_version", entity_id=version_id, action="dictionary version created", after=payload)
    db.commit()
    db.refresh(version)
    return {"id": version.id, "versionId": version.version_id, "status": version.status, "data": version.data, "createdAt": version.created_at}


def activate_dictionary_version_record(db: Session, version_id: str) -> dict[str, Any]:
    versions = db.scalars(select(DictionaryVersion)).all()
    target = None
    for version in versions:
        version.status = "active" if version.version_id == version_id else "inactive"
        if version.version_id == version_id:
            target = version
    if target is None and version_id == DICTIONARY_VERSION:
        return {"status": "active", "versionId": DICTIONARY_VERSION}
    if target is None:
        raise RuleNotFoundError("Dictionary version not found")
    _audit(db, project_id=None, entity_type="dictionary_version", entity_id=version_id, action="dictionary version activated")
    db.commit()
    return {"status": "active", "versionId": version_id}


def rule_definition_payload(rule: RuleDefinition) -> dict[str, Any]:
    return {"id": rule.id, "ruleId": rule.rule_id, "versionId": rule.version_id, "description": rule.description, "enabled": rule.enabled, "data": rule.data}


def update_rule_definition(db: Session, rule_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    rule = db.scalar(select(RuleDefinition).where(RuleDefinition.rule_id == rule_id))
    if rule is None:
        rule = RuleDefinition(
            rule_id=rule_id,
            version_id=str(payload.get("versionId") or RULE_VERSION),
            description=str(payload.get("description") or "Custom rule definition."),
            enabled=bool(payload.get("enabled", True)),
            data=payload,
        )
        db.add(rule)
    else:
        if "description" in payload:
            rule.description = str(payload["description"])
        if "enabled" in payload:
            rule.enabled = bool(payload["enabled"])
        rule.data = {**rule.data, **payload}
    _audit(db, project_id=None, entity_type="rule_definition", entity_id=rule_id, action="rule edited", after=payload)
    db.commit()
    db.refresh(rule)
    return rule_definition_payload(rule)


def create_rule_version_record(db: Session, payload: dict[str, Any]) -> dict[str, Any]:
    version_id = str(payload.get("versionId") or payload.get("version_id") or f"rules_custom_{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}")
    version = RuleVersion(version_id=version_id, status="draft", data=payload)
    db.add(version)
    _audit(db, project_id=None, entity_type="rule_version", entity_id=version_id, action="rule version created", after=payload)
    db.commit()
    db.refresh(version)
    return {"id": version.id, "versionId": version.version_id, "status": version.status, "data": version.data, "createdAt": version.created_at}


def activate_rule_version_record(db: Session, version_id: str) -> dict[str, Any]:
    versions = db.scalars(select(RuleVersion)).all()
    target = None
    for version in versions:
        version.status = "active" if version.version_id == version_id else "inactive"
        if version.version_id == version_id:
            target = version
    if target is None and version_id == RULE_VERSION:
        return {"status": "active", "versionId": RULE_VERSION}
    if target is None:
        raise RuleNotFoundError("Rule version not found")
    _audit(db, project_id=None, entity_type="rule_version", entity_id=version_id, action="rule version activated")
    db.commit()
    return {"status": "active", "versionId": version_id}





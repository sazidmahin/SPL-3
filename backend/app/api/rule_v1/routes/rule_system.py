from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.rule_system import (
    ClarificationAnswerRequest,
    ClarificationPatchRequest,
    ManualClarificationRequest,
    PatchPayload,
    RequirementCreateRequest,
    RuleProjectCreateRequest,
    RuleProjectUpdateRequest,
    StoryRevisionCreateRequest,
    XmlOverrideRequest,
    XmlValidateRequest,
)
from app.services.rule_system_service import (
    RuleInvalidStateError,
    RuleNotFoundError,
    add_class,
    add_manual_clarification,
    add_relationship,
    add_requirement,
    answer_clarification,
    approve_stage,
    create_rule_project,
    create_story_revision,
    delete_class,
    delete_relationship,
    delete_requirement,
    delete_rule_project,
    activate_dictionary_version_record,
    activate_rule_version_record,
    create_dictionary_entry,
    create_dictionary_version_record,
    create_rule_version_record,
    dictionaries_index,
    dictionary_detail,
    dictionary_export,
    get_class_model,
    get_final_story,
    get_rule_project,
    get_story_revision,
    get_xml,
    list_clarifications,
    list_requirements,
    list_rule_projects,
    list_stages,
    list_story_revisions,
    patch_class,
    patch_clarification,
    patch_final_story_section,
    patch_relationship,
    patch_requirement,
    reopen_stage,
    run_class_model,
    run_clarifications,
    run_final_story,
    run_requirements,
    run_xml,
    save_manual_xml,
    update_dictionary_entry,
    update_rule_definition,
    update_rule_project,
    validate_xml_text,
)

router = APIRouter()


def _handle_error(exc: Exception) -> HTTPException:
    if isinstance(exc, RuleNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, RuleInvalidStateError):
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc))
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/projects", status_code=status.HTTP_201_CREATED)
def create_project(payload: RuleProjectCreateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return create_rule_project(db, name=payload.name, description=payload.description)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects")
def get_projects(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    return list_rule_projects(db)


@router.get("/projects/{project_id}")
def get_project(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return get_rule_project(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.patch("/projects/{project_id}")
def patch_project(project_id: UUID, payload: RuleProjectUpdateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return update_rule_project(db, project_id, payload.model_dump(exclude_unset=True))
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.delete("/projects/{project_id}")
def remove_project(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        return delete_rule_project(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/stories", status_code=status.HTTP_201_CREATED)
def create_story(project_id: UUID, payload: StoryRevisionCreateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return create_story_revision(db, project_id, original_text=payload.original_text)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects/{project_id}/stories")
def get_stories(project_id: UUID, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        return list_story_revisions(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects/{project_id}/stories/{revision_id}")
def get_story(project_id: UUID, revision_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return get_story_revision(db, project_id, revision_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/run/clarifications")
def analyze_for_clarifications(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return run_clarifications(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects/{project_id}/clarifications")
def get_clarifications(project_id: UUID, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        return list_clarifications(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.patch("/projects/{project_id}/clarifications/{question_id}")
def update_clarification(project_id: UUID, question_id: str, payload: ClarificationPatchRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return patch_clarification(db, project_id, question_id, payload.model_dump(by_alias=True, exclude_unset=True))
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/clarifications/{question_id}/answer", status_code=status.HTTP_201_CREATED)
def submit_answer(project_id: UUID, question_id: str, payload: ClarificationAnswerRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return answer_clarification(db, project_id, question_id, payload.model_dump(by_alias=True))
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/clarifications/manual", status_code=status.HTTP_201_CREATED)
def create_manual_question(project_id: UUID, payload: ManualClarificationRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return add_manual_clarification(db, project_id, payload.model_dump(by_alias=True))
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/run/final-story")
def build_final_story(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return run_final_story(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects/{project_id}/final-story")
def read_final_story(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return get_final_story(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.patch("/projects/{project_id}/final-story/{section_id}")
def update_final_story_section(project_id: UUID, section_id: str, payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return patch_final_story_section(db, project_id, section_id, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/run/requirements")
def build_requirements(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return run_requirements(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects/{project_id}/requirements")
def read_requirements(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return list_requirements(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/requirements", status_code=status.HTTP_201_CREATED)
def create_requirement(project_id: UUID, payload: RequirementCreateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return add_requirement(db, project_id, payload.model_dump(by_alias=True))
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.patch("/projects/{project_id}/requirements/{requirement_id}")
def update_requirement(project_id: UUID, requirement_id: str, payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return patch_requirement(db, project_id, requirement_id, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.delete("/projects/{project_id}/requirements/{requirement_id}")
def remove_requirement(project_id: UUID, requirement_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        return delete_requirement(db, project_id, requirement_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/run/class-model")
def build_class_model(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return run_class_model(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects/{project_id}/class-model")
def read_class_model(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return get_class_model(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/class-model/classes", status_code=status.HTTP_201_CREATED)
def create_class(project_id: UUID, payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return add_class(db, project_id, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.patch("/projects/{project_id}/class-model/classes/{class_id}")
def update_class(project_id: UUID, class_id: str, payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return patch_class(db, project_id, class_id, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.delete("/projects/{project_id}/class-model/classes/{class_id}")
def remove_class(project_id: UUID, class_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return delete_class(db, project_id, class_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/class-model/relationships", status_code=status.HTTP_201_CREATED)
def create_relationship(project_id: UUID, payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return add_relationship(db, project_id, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.patch("/projects/{project_id}/class-model/relationships/{relationship_id}")
def update_relationship(project_id: UUID, relationship_id: str, payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return patch_relationship(db, project_id, relationship_id, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.delete("/projects/{project_id}/class-model/relationships/{relationship_id}")
def remove_relationship(project_id: UUID, relationship_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return delete_relationship(db, project_id, relationship_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/run/xml")
def build_xml(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return run_xml(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects/{project_id}/xml")
def read_xml(project_id: UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return get_xml(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.put("/projects/{project_id}/xml/manual-override")
def override_xml(project_id: UUID, payload: XmlOverrideRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return save_manual_xml(db, project_id, payload.xml)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects/{project_id}/xml/download", response_class=Response)
def download_xml(project_id: UUID, db: Session = Depends(get_db)) -> Response:
    try:
        payload = get_xml(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc
    return Response(
        content=payload["xml"],
        media_type="application/xml; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="rule-project-{project_id}.drawio"'},
    )


@router.post("/projects/{project_id}/xml/validate")
def validate_xml(project_id: UUID, payload: XmlValidateRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return validate_xml_text(db, project_id, payload.xml)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/stages/{stage_name}/approve")
def approve(project_id: UUID, stage_name: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return approve_stage(db, project_id, stage_name)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/projects/{project_id}/stages/{stage_name}/reopen")
def reopen(project_id: UUID, stage_name: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return reopen_stage(db, project_id, stage_name)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/projects/{project_id}/stages")
def stages(project_id: UUID, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    try:
        return list_stages(db, project_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/dictionaries")
def dictionaries() -> dict[str, Any]:
    return dictionaries_index()


@router.get("/dictionaries/export")
def export_dictionaries() -> dict[str, Any]:
    return dictionary_export()


@router.get("/dictionaries/{dictionary_name}")
def get_dictionary(dictionary_name: str) -> dict[str, Any]:
    try:
        return dictionary_detail(dictionary_name)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dictionary not found") from exc


@router.post("/dictionaries/{dictionary_name}/entries", status_code=status.HTTP_201_CREATED)
def add_dictionary_entry_route(dictionary_name: str, payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return create_dictionary_entry(db, dictionary_name, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.patch("/dictionaries/{dictionary_name}/entries/{entry_id}")
def update_dictionary_entry_route(dictionary_name: str, entry_id: str, payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return update_dictionary_entry(db, dictionary_name, entry_id, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/dictionaries/import")
def import_dictionaries(payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return create_dictionary_version_record(db, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/dictionaries/versions")
def create_dictionary_version(payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return create_dictionary_version_record(db, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/dictionaries/versions/{version_id}/activate")
def activate_dictionary_version(version_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return activate_dictionary_version_record(db, version_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.get("/rules")
def list_rules() -> dict[str, Any]:
    return {
        "activeVersionId": "rules_v1",
        "rules": [
            "TXT_UNICODE_NFKC_001",
            "SPL_SENTENCE_TERMINATOR_001",
            "EXT_ACTION_ALIAS_001",
            "CLR_MISSING_ACTOR_001",
            "FR_ACTOR_ACTION_OBJECT_001",
            "CLS_CANDIDATE_SCORE_001",
            "XML_STABLE_CLASS_ID_001",
        ],
    }


@router.get("/rules/{rule_id}")
def get_rule(rule_id: str) -> dict[str, Any]:
    return {"ruleId": rule_id, "versionId": "rules_v1", "enabled": True}


@router.patch("/rules/{rule_id}")
def update_rule(rule_id: str, payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return update_rule_definition(db, rule_id, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/rules/versions")
def create_rule_version(payload: PatchPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return create_rule_version_record(db, payload.data)
    except Exception as exc:
        raise _handle_error(exc) from exc


@router.post("/rules/versions/{version_id}/activate")
def activate_rule_version(version_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        return activate_rule_version_record(db, version_id)
    except Exception as exc:
        raise _handle_error(exc) from exc


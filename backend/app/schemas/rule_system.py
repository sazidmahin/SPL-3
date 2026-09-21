from typing import Any

from pydantic import BaseModel, Field


class RuleProjectCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class RuleProjectUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


class StoryRevisionCreateRequest(BaseModel):
    original_text: str = Field(alias="originalText", min_length=1)


class ClarificationPatchRequest(BaseModel):
    question_text: str | None = Field(default=None, alias="questionText")
    status: str | None = None
    suggested_options: list[str] | None = Field(default=None, alias="suggestedOptions")


class ClarificationAnswerRequest(BaseModel):
    answer_text: str | None = Field(default=None, alias="answerText")
    status: str = "answered"
    applied_slot: str | None = Field(default=None, alias="appliedSlot")


class ManualClarificationRequest(BaseModel):
    question_text: str = Field(alias="questionText", min_length=1)
    source_sentence: str | None = Field(default=None, alias="sourceSentence")
    reason: str | None = None
    related_actor: str | None = Field(default=None, alias="relatedActor")
    related_action: str | None = Field(default=None, alias="relatedAction")
    related_object: str | None = Field(default=None, alias="relatedObject")
    suggested_options: list[str] = Field(default_factory=list, alias="suggestedOptions")
    answer_mapping: str | None = Field(default=None, alias="answerMapping")


class PatchPayload(BaseModel):
    data: dict[str, Any] = Field(default_factory=dict)


class RequirementCreateRequest(BaseModel):
    requirement_id: str | None = Field(default=None, alias="requirementId")
    requirement_type: str = Field(default="functional", alias="requirementType")
    statement: str
    source_story_section_id: str | None = Field(default=None, alias="sourceStorySectionId")
    source_sentence: str | None = Field(default=None, alias="sourceSentence")
    matched_rule_id: str = Field(default="FR_MANUAL_REQUIREMENT_001", alias="matchedRuleId")
    extraction_method: str = Field(default="MANUAL_EDIT", alias="extractionMethod")
    actor: str | None = None
    action: str | None = None
    object: str | None = None
    condition: str | None = None
    warnings: list[str] = Field(default_factory=list)
    enabled: bool = True


class XmlOverrideRequest(BaseModel):
    xml: str = Field(min_length=1)


class XmlValidateRequest(BaseModel):
    xml: str = Field(min_length=1)

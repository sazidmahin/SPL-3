import re
import unicodedata
import xml.etree.ElementTree as ET
from collections import Counter
from copy import deepcopy
from html import escape
from typing import Any

from app.rule_engine.dictionaries import DICTIONARY_VERSION, load_dictionaries

RULE_VERSION = "rules_v1"
STAGES = ["input", "clarifications", "final-story", "requirements", "class-model", "xml"]
STAGE_STATUSES = {"DRAFT", "READY_FOR_REVIEW", "APPROVED", "STALE", "FAILED"}
RELATIONSHIP_TYPE_ALIASES = {
    "association": "association",
    "aggregation": "aggregation",
    "composition": "composition",
    "dependency": "dependency",
    "inheritance": "inheritance",
    "generalization": "inheritance",
    "extends": "inheritance",
    "inherits": "inheritance",
    "realization": "realization",
    "implementation": "realization",
    "implements": "realization",
}
RELATIONSHIP_TYPES = frozenset(RELATIONSHIP_TYPE_ALIASES.values())
CARDINALITY_RELATIONSHIP_TYPES = frozenset({"association", "aggregation", "composition"})
ASSOCIATION_DIRECTIONS = frozenset(
    {"undirected", "source-to-target", "target-to-source", "bidirectional"}
)
MULTIPLICITY_PATTERN = re.compile(r"^(?:\*|\d+|\d+\.\.(?:\d+|\*))$")


def normalize_relationship_type(value: Any) -> str | None:
    return RELATIONSHIP_TYPE_ALIASES.get(str(value or "").strip().lower())


def normalize_association_direction(value: Any) -> str | None:
    direction = str(value or "undirected").strip().lower()
    if direction in {"none", "unspecified"}:
        direction = "undirected"
    return direction if direction in ASSOCIATION_DIRECTIONS else None


def relationship_drawio_style(relationship_type: str, direction: str = "undirected") -> str:
    canonical_type = normalize_relationship_type(relationship_type)
    if canonical_type is None:
        raise ValueError(f"Unsupported relationship type: {relationship_type}")
    base = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;"
    if canonical_type == "association":
        canonical_direction = normalize_association_direction(direction)
        if canonical_direction is None:
            raise ValueError(f"Invalid association direction: {direction}")
        arrows = {
            "source-to-target": "startArrow=none;endArrow=open;endFill=0;",
            "target-to-source": "startArrow=open;startFill=0;endArrow=none;",
            "bidirectional": "startArrow=open;startFill=0;endArrow=open;endFill=0;",
            "undirected": "startArrow=none;endArrow=none;",
        }
        return base + "dashed=0;" + arrows[canonical_direction]
    styles = {
        "composition": "dashed=0;startArrow=diamondThin;startFill=1;endArrow=none;",
        "aggregation": "dashed=0;startArrow=diamondThin;startFill=0;endArrow=none;",
        "inheritance": "dashed=0;startArrow=none;endArrow=block;endFill=0;",
        "dependency": "dashed=1;startArrow=none;endArrow=open;endFill=0;",
        "realization": "dashed=1;startArrow=none;endArrow=block;endFill=0;",
    }
    return base + styles[canonical_type]


def snake_case(value: str) -> str:
    expanded = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", value)
    words = re.findall(r"[A-Za-z0-9]+", expanded)
    return "_".join(word.lower() for word in words) or "unknown"


def pascal_case(value: str | None) -> str:
    if not value:
        return "Unknown"
    words = re.findall(r"[A-Za-z0-9]+", value)
    return "".join(word[:1].upper() + word[1:].lower() for word in words) or "Unknown"


def camel_case(value: str) -> str:
    pascal = pascal_case(value)
    return pascal[:1].lower() + pascal[1:]


def singularize(value: str) -> str:
    cleaned = value.strip()
    lowered = cleaned.lower()
    if lowered.endswith("ies") and len(lowered) > 3:
        return cleaned[:-3] + "y"
    if lowered.endswith("sses"):
        return cleaned[:-2]
    if lowered.endswith("s") and not lowered.endswith("ss") and len(lowered) > 3:
        return cleaned[:-1]
    return cleaned


def normalize_entity(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"^(at least one|at most one|exactly one|zero or one|one or more|zero or more|a specific number|a|an|the|one|many|multiple|several|single|optional)\s+", "", value.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned)
    if not cleaned:
        return None
    return pascal_case(singularize(cleaned))


def normalize_text(raw_text: str) -> dict[str, Any]:
    normalized = unicodedata.normalize("NFKC", raw_text)
    normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[ \t\f\v]+", " ", normalized)
    normalized = re.sub(r"\n+", "\n", normalized).strip()
    return {
        "rawText": raw_text,
        "normalizedText": normalized,
        "matchedRuleIds": ["TXT_UNICODE_NFKC_001", "TXT_WHITESPACE_COLLAPSE_001"],
    }


def split_sentences(normalized_text: str) -> list[dict[str, Any]]:
    parts: list[dict[str, Any]] = []
    for index, match in enumerate(re.finditer(r"[^.!?\n]+(?:[.!?]|$)", normalized_text), start=1):
        text = match.group(0).strip()
        if not text:
            continue
        parts.append(
            {
                "id": f"sentence_{index:03d}",
                "text": text,
                "normalizedText": text.rstrip(".!?").strip(),
                "sentenceIndex": index,
                "startOffset": match.start(),
                "endOffset": match.end(),
                "matchedRuleId": "SPL_SENTENCE_TERMINATOR_001",
            }
        )
    return parts


def split_clauses(sentences: list[dict[str, Any]]) -> list[dict[str, Any]]:
    clauses: list[dict[str, Any]] = []
    for sentence in sentences:
        raw_parts = [part.strip() for part in re.split(r"\s*;\s*|\s*,\s*|\s+\band\b\s+|\s+\bthen\b\s+", sentence["normalizedText"]) if part.strip()]
        if not raw_parts:
            raw_parts = [sentence["normalizedText"]]
        for clause_index, text in enumerate(raw_parts, start=1):
            clauses.append(
                {
                    "id": f"clause_{sentence['sentenceIndex']:03d}_{clause_index:03d}",
                    "sentenceId": sentence["id"],
                    "text": text,
                    "normalizedText": text,
                    "sentenceIndex": sentence["sentenceIndex"],
                    "clauseIndex": clause_index,
                    "startOffset": sentence["text"].lower().find(text.lower()),
                    "endOffset": sentence["text"].lower().find(text.lower()) + len(text),
                    "matchedRuleId": "SPL_CLAUSE_COMMA_CONJUNCTION_001",
                }
            )
    return clauses


def tokenize(text: str) -> list[dict[str, Any]]:
    tokens = []
    for index, match in enumerate(re.finditer(r"[A-Za-z0-9']+", text), start=1):
        tokens.append(
            {
                "index": index,
                "text": match.group(0),
                "normalized": match.group(0).lower(),
                "startOffset": match.start(),
                "endOffset": match.end(),
                "matchedRuleId": "TOK_WORD_001",
            }
        )
    return tokens


def _action_aliases() -> dict[str, str]:
    return {key.lower(): value for key, value in load_dictionaries().get("action_aliases", {}).items()}


def _relationship_phrases() -> dict[str, str]:
    return {key.lower(): value for key, value in load_dictionaries().get("relationship_phrases", {}).items()}


def _nfr_keywords() -> dict[str, Any]:
    return load_dictionaries().get("nfr_keywords", {})


def _articles_pattern() -> str:
    return r"(?:a|an|the)\s+"


def _modal_pattern() -> str:
    dictionaries = load_dictionaries()
    modals = (
        dictionaries.get("permission_modals", [])
        + dictionaries.get("obligation_modals", [])
        + dictionaries.get("negative_modals", [])
    )
    ordered = sorted([re.escape(item) for item in modals], key=len, reverse=True)
    return r"(?:" + "|".join(ordered) + r")"


def _canonical_action(raw_action: str | None) -> tuple[str | None, str, list[str]]:
    if raw_action is None:
        return None, "EXT_NO_ACTION_001", []
    lowered = raw_action.strip().lower()
    canonical = _action_aliases().get(lowered)
    if canonical:
        return canonical, "EXT_ACTION_ALIAS_001", []
    return lowered, "EXT_UNKNOWN_ACTION_001", [f'Unknown action "{raw_action}".']


def _condition_from_text(text: str) -> dict[str, Any] | None:
    match = re.search(r"\b(?:if|when|unless)\s+(?:the\s+|a\s+|an\s+)?(?P<subject>[a-zA-Z][\w -]*?)\s+(?P<verb>fails|failed|is failed|succeeds|expires|is invalid|is valid)\b", text, re.IGNORECASE)
    if not match:
        return None
    verb = match.group("verb").lower().replace("is ", "")
    return {"subject": normalize_entity(match.group("subject")), "operator": "is", "value": "failed" if verb in {"fails", "failed"} else verb}


def _quantity_from_text(text: str) -> tuple[str | None, str | None]:
    lowered = text.lower()
    quantifiers = load_dictionaries().get("quantifiers", {})
    for phrase, multiplicity in sorted(quantifiers.items(), key=lambda item: len(item[0]), reverse=True):
        if re.search(rf"\b{re.escape(phrase)}\b", lowered):
            return multiplicity, "MUL_QUANTIFIER_DICTIONARY_001"
    patterns = [
        (r"exactly\s+(\d+)", "{0}", "MUL_EXACT_NUMBER_001"),
        (r"at least\s+(\d+)", "{0}..*", "MUL_AT_LEAST_NUMBER_001"),
        (r"at most\s+(\d+)", "0..{0}", "MUL_AT_MOST_NUMBER_001"),
        (r"(?:maximum|up to)\s+(\d+)", "0..{0}", "MUL_MAX_NUMBER_001"),
        (r"minimum\s+(\d+)", "{0}..*", "MUL_MIN_NUMBER_001"),
        (r"between\s+(\d+)\s+and\s+(\d+)", "{0}..{1}", "MUL_BETWEEN_NUMBER_001"),
    ]
    for pattern, template, rule_id in patterns:
        match = re.search(pattern, lowered)
        if match:
            return template.format(*match.groups()), rule_id
    return None, None


def _modality(text: str) -> tuple[str, bool]:
    lowered = text.lower()
    for phrase in load_dictionaries().get("negative_modals", []):
        if re.search(rf"\b{re.escape(phrase)}\b", lowered):
            return "negative", True
    for phrase in load_dictionaries().get("obligation_modals", []):
        if re.search(rf"\b{re.escape(phrase)}\b", lowered):
            return "obligation", False
    return "permission", False


def _nfr_from_sentence(sentence: dict[str, Any]) -> dict[str, Any] | None:
    text = sentence["normalizedText"]
    lowered = text.lower()
    for category, config in _nfr_keywords().items():
        if any(re.search(rf"\b{re.escape(keyword)}\b", lowered) for keyword in config.get("keywords", [])):
            number_match = re.search(r"\b(?:within|under|less than|no more than)\s+(?P<number>\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?P<unit>seconds?|minutes?|hours?|ms|milliseconds?)\b", lowered)
            words_to_numbers = {
                "one": 1,
                "two": 2,
                "three": 3,
                "four": 4,
                "five": 5,
                "six": 6,
                "seven": 7,
                "eight": 8,
                "nine": 9,
                "ten": 10,
            }
            metric = config.get("metric")
            target = None
            unit = None
            measurable = False
            if number_match:
                raw_number = number_match.group("number")
                target = int(raw_number) if raw_number.isdigit() else words_to_numbers[raw_number]
                unit = number_match.group("unit")
                measurable = True
            return {
                "category": category,
                "metric": metric,
                "operator": "<=" if measurable else None,
                "targetValue": target,
                "unit": unit,
                "measurable": measurable,
                "matchedRuleId": f"NFR_{category.upper()}_KEYWORD_001",
                "warnings": [] if measurable else [f"No numeric {category.lower()} target was found."],
            }
    return None


def _fact_template(
    *,
    fact_index: int,
    sentence: dict[str, Any],
    clause: dict[str, Any],
    actor: str | None,
    action: str | None,
    object_name: str | None,
    raw_action: str | None,
    matched_rule_id: str,
    extraction_type: str,
    condition: dict[str, Any] | None = None,
    relationship_type: str | None = None,
    source_multiplicity: str | None = None,
    target_multiplicity: str | None = None,
    nfr: dict[str, Any] | None = None,
    warnings: list[str] | None = None,
) -> dict[str, Any]:
    modality, negated = _modality(clause["text"])
    missing = []
    if actor is None and nfr is None:
        missing.append("actor")
    if action is None and nfr is None:
        missing.append("action")
    if object_name is None and nfr is None:
        missing.append("object")
    return {
        "id": f"fact_{fact_index:03d}",
        "sourceText": clause["text"],
        "sourceSentenceId": sentence["id"],
        "sourceClauseId": clause["id"],
        "sentenceIndex": sentence["sentenceIndex"],
        "clauseIndex": clause["clauseIndex"],
        "actor": actor,
        "action": action,
        "rawAction": raw_action,
        "object": object_name,
        "indirectObject": None,
        "condition": condition,
        "trigger": None,
        "precondition": None,
        "postcondition": None,
        "modality": modality,
        "negated": negated,
        "quantity": target_multiplicity,
        "sourceMultiplicity": source_multiplicity,
        "targetMultiplicity": target_multiplicity,
        "temporalConstraint": None,
        "state": None,
        "previousState": None,
        "nextState": None,
        "relationshipType": relationship_type,
        "nfr": nfr,
        "matchedRuleId": matched_rule_id,
        "extractionType": extraction_type,
        "missingFields": missing,
        "warnings": warnings or [],
    }


def extract_facts(sentences: list[dict[str, Any]], clauses: list[dict[str, Any]]) -> list[dict[str, Any]]:
    facts: list[dict[str, Any]] = []
    known_entities: list[str] = []
    sentence_lookup = {sentence["id"]: sentence for sentence in sentences}
    modal_pattern = _modal_pattern()
    article = _articles_pattern()

    for clause in clauses:
        sentence = sentence_lookup[clause["sentenceId"]]
        text = clause["normalizedText"].strip()
        lowered = text.lower()
        fact_index = len(facts) + 1
        condition = _condition_from_text(sentence["normalizedText"])
        nfr = _nfr_from_sentence(sentence)

        if nfr and ("system" in lowered or nfr["category"]):
            facts.append(
                _fact_template(
                    fact_index=fact_index,
                    sentence=sentence,
                    clause=clause,
                    actor="System",
                    action=nfr.get("metric") or "satisfy",
                    object_name=nfr["category"],
                    raw_action=nfr.get("metric"),
                    matched_rule_id=nfr["matchedRuleId"],
                    extraction_type="DICTIONARY_PATTERN",
                    nfr=nfr,
                    warnings=nfr["warnings"],
                )
            )
            known_entities.extend(["System", nfr["category"]])
            continue

        passive_match = re.match(
            rf"^(?:{article})?(?P<object>[a-zA-Z][\w -]*?)\s+{modal_pattern}\s+be\s+(?P<action>[a-zA-Z]+)$",
            text,
            flags=re.IGNORECASE,
        )
        if passive_match:
            raw_action = passive_match.group("action")
            object_name = normalize_entity(passive_match.group("object"))
            action, _, warnings = _canonical_action(raw_action)
            facts.append(
                _fact_template(
                    fact_index=fact_index,
                    sentence=sentence,
                    clause=clause,
                    actor=None,
                    action=action,
                    object_name=object_name,
                    raw_action=raw_action,
                    matched_rule_id="EXT_PASSIVE_OBJECT_ACTION_001",
                    extraction_type="PASSIVE_PATTERN",
                    warnings=warnings,
                )
            )
            if object_name:
                known_entities.append(object_name)
            continue

        relationship_match = None
        relationship_type = None
        for phrase, rel_type in sorted(_relationship_phrases().items(), key=lambda item: len(item[0]), reverse=True):
            pattern = rf"^(?:{article})?(?P<source>[a-zA-Z][\w -]*?)\s+(?:{modal_pattern}\s+)?{re.escape(phrase)}\s+(?P<object>.+)$"
            relationship_match = re.match(pattern, text, flags=re.IGNORECASE)
            if relationship_match:
                relationship_type = rel_type
                raw_action = phrase
                break
        if relationship_match and relationship_type:
            actor = normalize_entity(relationship_match.group("source"))
            object_name = normalize_entity(relationship_match.group("object"))
            action, _, action_warnings = _canonical_action(raw_action)
            warnings = action_warnings
            source_multiplicity = None
            target_multiplicity = None
            multiplicity_rule = None
            if relationship_type in CARDINALITY_RELATIONSHIP_TYPES:
                target_multiplicity, multiplicity_rule = _quantity_from_text(text)
                source_multiplicity = "1"
                if target_multiplicity is None:
                    target_multiplicity = "0..*"
                    warnings.append("Default multiplicity applied.")
            facts.append(
                _fact_template(
                    fact_index=fact_index,
                    sentence=sentence,
                    clause=clause,
                    actor=actor,
                    action=action,
                    object_name=object_name,
                    raw_action=raw_action,
                    matched_rule_id="REL_PHRASE_DICTIONARY_001" if multiplicity_rule is None else multiplicity_rule,
                    extraction_type="PHRASE_PATTERN",
                    relationship_type=relationship_type,
                    source_multiplicity=source_multiplicity,
                    target_multiplicity=target_multiplicity,
                    warnings=warnings,
                )
            )
            known_entities.extend([item for item in [actor, object_name] if item])
            continue

        only_match = re.match(
            rf"^only\s+(?:{article})?(?P<actor>[a-zA-Z][\w -]*?)\s+{modal_pattern}\s+(?P<action>[a-zA-Z][\w ]*?)\s+(?:{article})?(?P<object>[a-zA-Z][\w -]*)$",
            text,
            flags=re.IGNORECASE,
        )
        active_match = re.match(
            rf"^(?:{article})?(?P<actor>[a-zA-Z][\w -]*?)\s+{modal_pattern}\s+(?P<action>[a-zA-Z][\w ]*?)\s+(?:{article})?(?P<object>[a-zA-Z][\w -]*)$",
            text,
            flags=re.IGNORECASE,
        )
        passive_match = None

        match = only_match or active_match
        if match:
            raw_action = match.group("action").strip()
            action, action_rule_id, warnings = _canonical_action(raw_action)
            actor = normalize_entity(match.group("actor"))
            object_name = normalize_entity(match.group("object"))
            if object_name and object_name.lower() in load_dictionaries().get("pronouns", {}).get("objectPronouns", []):
                if len(set(known_entities)) == 1:
                    object_name = known_entities[-1]
                elif condition and condition.get("subject"):
                    object_name = condition["subject"]
                else:
                    warnings.append(f'Pronoun "{match.group("object")}" has multiple possible references.')
            facts.append(
                _fact_template(
                    fact_index=fact_index,
                    sentence=sentence,
                    clause=clause,
                    actor=actor,
                    action=action,
                    object_name=object_name,
                    raw_action=raw_action,
                    matched_rule_id="EXT_ONLY_ACTOR_CAN_ACTION_OBJECT_001" if only_match else action_rule_id,
                    extraction_type="EXACT_PATTERN" if action_rule_id != "EXT_UNKNOWN_ACTION_001" else "POSITIONAL_GUESS",
                    condition=condition,
                    warnings=warnings,
                )
            )
            known_entities.extend([item for item in [actor, object_name] if item and item not in {"It", "This", "That"}])
            continue

        if passive_match:
            raw_action = passive_match.group("action")
            object_name = normalize_entity(passive_match.group("object"))
            action, _, warnings = _canonical_action(raw_action)
            if action is None and raw_action:
                action = raw_action
            facts.append(
                _fact_template(
                    fact_index=fact_index,
                    sentence=sentence,
                    clause=clause,
                    actor=None,
                    action=action,
                    object_name=object_name,
                    raw_action=raw_action,
                    matched_rule_id="EXT_PASSIVE_OBJECT_ACTION_001",
                    extraction_type="PASSIVE_PATTERN",
                    warnings=warnings,
                )
            )
            if object_name:
                known_entities.append(object_name)
            continue

        tokens = tokenize(text)
        action_token = next((token for token in tokens if token["normalized"] in _action_aliases()), None)
        if action_token:
            before = " ".join(token["text"] for token in tokens[: action_token["index"] - 1])
            after = " ".join(token["text"] for token in tokens[action_token["index"] :])
            action, _, warnings = _canonical_action(action_token["text"])
            actor = normalize_entity(before) or None
            object_name = normalize_entity(after) or None
            facts.append(
                _fact_template(
                    fact_index=fact_index,
                    sentence=sentence,
                    clause=clause,
                    actor=actor,
                    action=action,
                    object_name=object_name,
                    raw_action=action_token["text"],
                    matched_rule_id="EXT_POSITIONAL_ACTION_001",
                    extraction_type="POSITIONAL_GUESS",
                    condition=condition,
                    warnings=warnings,
                )
            )
    return facts


def generate_clarifications(facts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    questions: list[dict[str, Any]] = []
    for fact in facts:
        sequence = len(questions) + 1
        actor = fact.get("actor")
        action = fact.get("action")
        object_name = fact.get("object")
        source = fact.get("sourceText")
        if action and object_name and not actor:
            questions.append(
                {
                    "id": f"CLR-{sequence:03d}",
                    "text": f"Who can {action} the {object_name}?",
                    "sourceSentence": source,
                    "reason": "Action and object were found, but actor was missing.",
                    "triggeredRuleId": "CLR_MISSING_ACTOR_001",
                    "relatedActor": actor,
                    "relatedAction": action,
                    "relatedObject": object_name,
                    "suggestedOptions": [],
                    "sourceFactId": fact["id"],
                    "answerMapping": "actor",
                }
            )
        elif actor and action and not object_name:
            questions.append(
                {
                    "id": f"CLR-{sequence:03d}",
                    "text": f"What can the {actor} {action}?",
                    "sourceSentence": source,
                    "reason": "Actor and action were found, but object was missing.",
                    "triggeredRuleId": "CLR_MISSING_OBJECT_001",
                    "relatedActor": actor,
                    "relatedAction": action,
                    "relatedObject": object_name,
                    "suggestedOptions": [],
                    "sourceFactId": fact["id"],
                    "answerMapping": "object",
                }
            )
        elif actor and object_name and not action:
            questions.append(
                {
                    "id": f"CLR-{sequence:03d}",
                    "text": f"What does the {actor} do with the {object_name}?",
                    "sourceSentence": source,
                    "reason": "Actor and object were found, but action was missing.",
                    "triggeredRuleId": "CLR_MISSING_ACTION_001",
                    "relatedActor": actor,
                    "relatedAction": action,
                    "relatedObject": object_name,
                    "suggestedOptions": [],
                    "sourceFactId": fact["id"],
                    "answerMapping": "action",
                }
            )
        elif any("Unknown action" in warning for warning in fact.get("warnings", [])):
            questions.append(
                {
                    "id": f"CLR-{sequence:03d}",
                    "text": f'What does "{fact.get("rawAction")}" mean in this story?',
                    "sourceSentence": source,
                    "reason": "Probable action is not present in the action dictionary.",
                    "triggeredRuleId": "CLR_UNKNOWN_ACTION_001",
                    "relatedActor": actor,
                    "relatedAction": action,
                    "relatedObject": object_name,
                    "suggestedOptions": [],
                    "sourceFactId": fact["id"],
                    "answerMapping": "canonicalAction",
                }
            )

        nfr = fact.get("nfr")
        if nfr and not nfr.get("measurable") and nfr.get("category") == "Performance":
            questions.append(
                {
                    "id": f"CLR-{len(questions) + 1:03d}",
                    "text": "What measurable performance target should be used?",
                    "sourceSentence": source,
                    "reason": "Performance keyword exists but numeric target is missing.",
                    "triggeredRuleId": "CLR_VAGUE_PERFORMANCE_001",
                    "relatedActor": actor,
                    "relatedAction": action,
                    "relatedObject": object_name,
                    "suggestedOptions": [],
                    "sourceFactId": fact["id"],
                    "answerMapping": "nfrTarget",
                }
            )
    return questions


def analyze_text(raw_text: str) -> dict[str, Any]:
    normalized = normalize_text(raw_text)
    sentences = split_sentences(normalized["normalizedText"])
    clauses = split_clauses(sentences)
    facts = extract_facts(sentences, clauses)
    questions = generate_clarifications(facts)
    return {
        "dictionaryVersionId": DICTIONARY_VERSION,
        "ruleVersionId": RULE_VERSION,
        "normalization": normalized,
        "sentences": sentences,
        "clauses": clauses,
        "facts": facts,
        "clarificationQuestions": questions,
    }


def apply_answers(facts: list[dict[str, Any]], answers: list[dict[str, Any]], question_lookup: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    merged = deepcopy(facts)
    fact_lookup = {fact["id"]: fact for fact in merged}
    for answer in sorted(answers, key=lambda item: item.get("createdAt", "")):
        question = question_lookup.get(answer["questionStableId"])
        if not question or answer.get("status") in {"skipped", "not_applicable"}:
            continue
        fact = fact_lookup.get(question.get("sourceFactId"))
        if not fact:
            continue
        value = answer.get("answerText")
        slot = answer.get("appliedSlot") or question.get("answerMapping")
        if not value or not slot:
            continue
        if slot == "canonicalAction":
            fact["action"] = camel_case(value) if " " in value else value.strip()
        elif slot == "nfrTarget":
            fact.setdefault("nfr", {})["targetValue"] = value
            fact["nfr"]["measurable"] = True
            fact["nfr"]["warnings"] = []
        elif slot in {"actor", "object"}:
            fact[slot] = normalize_entity(value)
        else:
            fact[slot] = value.strip()
        if slot in fact.get("missingFields", []):
            fact["missingFields"] = [field for field in fact["missingFields"] if field != slot]
        fact["extractionType"] = "CLARIFICATION_ANSWER"
    return merged


def condition_to_text(condition: dict[str, Any] | None) -> str | None:
    if not condition:
        return None
    return " ".join(str(part) for part in [condition.get("subject"), condition.get("value")] if part)


def generate_final_story(original_text: str, sentences: list[dict[str, Any]], facts: list[dict[str, Any]], answers: list[dict[str, Any]]) -> dict[str, Any]:
    sections = []
    for index, fact in enumerate(facts, start=1):
        actor = fact.get("actor") or "UnknownActor"
        action = fact.get("action") or "UnknownAction"
        object_name = fact.get("object") or "UnknownObject"
        condition = condition_to_text(fact.get("condition"))
        sentence = f"The {actor} can {action} an {object_name}."
        if condition:
            sentence = f"If {condition}, the {actor} can {action} an {object_name}."
        sections.append(
            {
                "id": f"US-001-S{index}",
                "actor": actor,
                "action": action,
                "object": object_name,
                "condition": condition,
                "trigger": fact.get("trigger"),
                "quantity": fact.get("quantity"),
                "modality": fact.get("modality"),
                "negation": fact.get("negated"),
                "temporalConstraint": fact.get("temporalConstraint"),
                "normalizedSentence": sentence,
                "sourceFactId": fact["id"],
                "sourceSentence": fact["sourceText"],
                "warnings": fact.get("warnings", []) + [f"{field} was not identified." for field in fact.get("missingFields", [])],
                "matchedRuleId": "FIN_ATOMIC_STORY_TEMPLATE_001",
            }
        )
    return {
        "originalText": original_text,
        "normalizedSentences": sentences,
        "atomicStorySections": sections,
        "appliedClarificationAnswers": answers,
        "unresolvedFields": sorted({field for fact in facts for field in fact.get("missingFields", [])}),
        "warnings": sorted({warning for section in sections for warning in section.get("warnings", [])}),
        "extractionMetadata": {"dictionaryVersionId": DICTIONARY_VERSION, "ruleVersionId": RULE_VERSION},
    }


def generate_requirements(final_story: dict[str, Any], facts: list[dict[str, Any]]) -> dict[str, Any]:
    requirements: list[dict[str, Any]] = []
    fact_lookup = {fact["id"]: fact for fact in facts}
    fr_count = nfr_count = br_count = 0
    for section in final_story.get("atomicStorySections", []):
        fact = fact_lookup.get(section["sourceFactId"], {})
        if fact.get("nfr"):
            nfr_count += 1
            nfr = fact["nfr"]
            req_id = f"NFR-{nfr_count:03d}"
            target = f" within {nfr['targetValue']} {nfr['unit']}" if nfr.get("measurable") and isinstance(nfr.get("targetValue"), int) else ""
            requirements.append(
                {
                    "id": req_id,
                    "requirementId": req_id,
                    "requirementType": "non_functional",
                    "statement": f"The system shall satisfy {nfr['category'].lower()} expectations{target}.",
                    "sourceStorySectionId": section["id"],
                    "sourceSentence": section["sourceSentence"],
                    "matchedRuleId": nfr["matchedRuleId"],
                    "extractionMethod": "DICTIONARY_PATTERN",
                    "actor": fact.get("actor"),
                    "action": fact.get("action"),
                    "object": fact.get("object"),
                    "condition": section.get("condition"),
                    "nfrCategory": nfr["category"],
                    "metric": nfr.get("metric"),
                    "operator": nfr.get("operator"),
                    "targetValue": nfr.get("targetValue"),
                    "unit": nfr.get("unit"),
                    "measurable": nfr.get("measurable"),
                    "warnings": nfr.get("warnings", []),
                    "enabled": True,
                }
            )
            continue

        actor = section.get("actor") or "UnknownActor"
        action = section.get("action") or "UnknownAction"
        object_name = section.get("object") or "UnknownObject"
        fr_count += 1
        req_id = f"FR-{fr_count:03d}"
        actor_phrase = "an unspecified actor" if actor == "UnknownActor" else f"the {actor}"
        condition = section.get("condition")
        statement = f"The system shall allow {actor_phrase} to {action} the {object_name}."
        if condition:
            statement = f"If {condition}, the system shall allow {actor_phrase} to {action} the {object_name}."
        requirements.append(
            {
                "id": req_id,
                "requirementId": req_id,
                "requirementType": "functional",
                "statement": statement,
                "sourceStorySectionId": section["id"],
                "sourceSentence": section["sourceSentence"],
                "matchedRuleId": "FR_CONDITIONAL_ACTOR_ACTION_OBJECT_001" if condition else "FR_ACTOR_ACTION_OBJECT_001",
                "extractionMethod": fact.get("extractionType", "UNCLASSIFIED"),
                "actor": actor,
                "action": action,
                "object": object_name,
                "condition": condition,
                "nfrCategory": None,
                "metric": None,
                "targetValue": None,
                "warnings": section.get("warnings", []),
                "enabled": True,
            }
        )
        source = " ".join([section.get("sourceSentence", ""), str(condition or "")]).lower()
        if any(keyword in source for keyword in ["only", "cannot", "must not", "at least", "at most", "exactly", "before", "after", "unless", "contain", "own"]):
            br_count += 1
            br_id = f"BR-{br_count:03d}"
            if "only" in source:
                br_statement = f"Only the {actor} may {action} the {object_name}."
                rule_id = "BR_ONLY_ACTOR_ACTION_OBJECT_001"
            elif "contain" in source or "own" in source:
                br_statement = f"The {actor} must maintain the required {object_name} relationship."
                rule_id = "BR_MANDATORY_CONTAINMENT_001"
            else:
                br_statement = f"The {actor} is constrained when attempting to {action} the {object_name}."
                rule_id = "BR_CONSTRAINT_KEYWORD_001"
            requirements.append(
                {
                    "id": br_id,
                    "requirementId": br_id,
                    "requirementType": "business_rule",
                    "statement": br_statement,
                    "sourceStorySectionId": section["id"],
                    "sourceSentence": section["sourceSentence"],
                    "matchedRuleId": rule_id,
                    "extractionMethod": "DICTIONARY_PATTERN",
                    "actor": actor,
                    "action": action,
                    "object": object_name,
                    "condition": condition,
                    "nfrCategory": None,
                    "metric": None,
                    "targetValue": fact.get("targetMultiplicity"),
                    "warnings": [],
                    "enabled": True,
                }
            )
    return {"requirements": requirements, "dictionaryVersionId": DICTIONARY_VERSION, "ruleVersionId": RULE_VERSION}


def _requirement_source_ids(requirements: list[dict[str, Any]], actor: str, object_name: str) -> list[str]:
    return sorted(
        {
            req["requirementId"]
            for req in requirements
            if req.get("enabled", True) and (req.get("actor") == actor or req.get("object") == object_name)
        }
    )


def generate_class_model(requirements: list[dict[str, Any]], facts: list[dict[str, Any]], threshold: int = 4) -> dict[str, Any]:
    scores: Counter[str] = Counter()
    source_fact_ids: dict[str, set[str]] = {}
    source_requirement_ids: dict[str, set[str]] = {}
    for fact in facts:
        for field, score in [("actor", 5), ("object", 4)]:
            value = fact.get(field)
            if value and not value.startswith("Unknown"):
                scores[value] += score
                source_fact_ids.setdefault(value, set()).add(fact["id"])
        if fact.get("relationshipType"):
            for field in ["actor", "object"]:
                value = fact.get(field)
                if value:
                    scores[value] += 4
    for requirement in requirements:
        if not requirement.get("enabled", True) or requirement.get("requirementType") == "non_functional":
            continue
        for field, score in [("actor", 5), ("object", 4)]:
            value = requirement.get(field)
            if value and not value.startswith("Unknown"):
                scores[value] += score
                source_requirement_ids.setdefault(value, set()).add(requirement["requirementId"])
    primitive = {item.lower() for item in load_dictionaries().get("primitive_attributes", [])}
    generic = {item.lower() for item in load_dictionaries().get("generic_nouns", [])}
    for name in list(scores):
        if name.lower() in primitive:
            scores[name] -= 5
        if name.lower() in generic:
            scores[name] -= 4
    class_names = sorted(name for name, score in scores.items() if score >= threshold)

    classes: dict[str, dict[str, Any]] = {}
    for name in class_names:
        class_id = f"class_{snake_case(name)}"
        source_ids = sorted(source_requirement_ids.get(name, set()) | set(_requirement_source_ids(requirements, name, name)))
        classes[class_id] = {
            "id": class_id,
            "name": name,
            "stereotype": "entity" if name != "System" else "service",
            "attributes": [],
            "methods": [],
            "sourceFactIds": sorted(source_fact_ids.get(name, set())),
            "sourceRequirementIds": source_ids,
            "warnings": [],
            "enabled": True,
        }

    method_signatures: set[tuple[str, str]] = set()
    relationships = []
    for requirement in requirements:
        if not requirement.get("enabled", True) or requirement.get("requirementType") == "non_functional":
            continue
        actor = requirement.get("actor")
        object_name = requirement.get("object")
        action = requirement.get("action")
        if not actor or not object_name or actor.startswith("Unknown") or object_name.startswith("Unknown"):
            continue
        source_id = f"class_{snake_case(actor)}"
        target_id = f"class_{snake_case(object_name)}"
        if source_id not in classes or target_id not in classes:
            continue
        method_name = camel_case(f"{action} {object_name}")
        method_key = (source_id, method_name)
        if method_key not in method_signatures:
            method_signatures.add(method_key)
            classes[source_id]["methods"].append(
                {
                    "id": f"method_{snake_case(actor)}_{snake_case(method_name)}",
                    "name": method_name,
                    "parameters": [],
                    "returnType": object_name,
                    "visibility": "public",
                    "static": False,
                    "sourceRequirementIds": [requirement["requirementId"]],
                }
            )

        fact = next((item for item in facts if item.get("id") == next((s.get("sourceFactId") for s in []), None)), None)
        fact = next((item for item in facts if item.get("sourceText") == requirement.get("sourceSentence")), {}) or {}
        rel_type = normalize_relationship_type(fact.get("relationshipType") or "association") or "association"
        if rel_type in CARDINALITY_RELATIONSHIP_TYPES:
            source_multiplicity = fact.get("sourceMultiplicity") or "1"
            target_multiplicity = fact.get("targetMultiplicity") or "0..*"
            warnings = [] if fact.get("targetMultiplicity") else ["Default multiplicity applied."]
        else:
            source_multiplicity = None
            target_multiplicity = None
            warnings = []
        relationships.append(
            {
                "id": f"edge_{snake_case(actor)}_{snake_case(action or 'uses')}_{snake_case(object_name)}",
                "sourceClassId": source_id,
                "targetClassId": target_id,
                "type": rel_type,
                "label": action or "uses",
                "sourceMultiplicity": source_multiplicity,
                "targetMultiplicity": target_multiplicity,
                "direction": "source-to-target",
                "sourceRequirementIds": [requirement["requirementId"]],
                "warnings": warnings,
                "enabled": True,
            }
        )

    return {
        "classes": sorted(classes.values(), key=lambda item: item["name"].lower()),
        "relationships": _dedupe_relationships(relationships),
        "enums": [],
        "constraints": [],
        "dictionaryVersionId": DICTIONARY_VERSION,
        "ruleVersionId": RULE_VERSION,
    }


def _dedupe_relationships(relationships: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str, str], dict[str, Any]] = {}
    for relationship in sorted(
        relationships,
        key=lambda item: (item["sourceClassId"], item["targetClassId"], item["type"], item["label"]),
    ):
        key = (relationship["sourceClassId"], relationship["targetClassId"], relationship["type"], relationship["label"])
        if key in grouped:
            grouped[key]["sourceRequirementIds"] = sorted(
                set(grouped[key]["sourceRequirementIds"]) | set(relationship["sourceRequirementIds"])
            )
        else:
            grouped[key] = relationship
    return list(grouped.values())


def validate_class_model(class_model: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    class_ids: set[str] = set()
    for item in class_model.get("classes", []):
        if not isinstance(item, dict) or not item.get("enabled", True):
            continue
        class_id = str(item.get("id") or "").strip()
        if not class_id:
            errors.append("Enabled class is missing an ID.")
        elif class_id in class_ids:
            errors.append(f"Duplicate class ID: {class_id}.")
        else:
            class_ids.add(class_id)

    relationship_ids: set[str] = set()
    inheritance_graph: dict[str, set[str]] = {}
    for relationship in class_model.get("relationships", []):
        if not isinstance(relationship, dict) or not relationship.get("enabled", True):
            continue
        relationship_id = str(relationship.get("id") or "").strip()
        if not relationship_id:
            errors.append("Enabled relationship is missing an ID.")
            relationship_id = "<missing>"
        elif relationship_id in relationship_ids or relationship_id in class_ids:
            errors.append(f"Duplicate diagram element ID: {relationship_id}.")
        else:
            relationship_ids.add(relationship_id)

        source_id = relationship.get("sourceClassId")
        target_id = relationship.get("targetClassId")
        if source_id not in class_ids:
            errors.append(f"Relationship {relationship_id} source class is missing or disabled.")
        if target_id not in class_ids:
            errors.append(f"Relationship {relationship_id} target class is missing or disabled.")

        canonical_type = normalize_relationship_type(relationship.get("type"))
        if canonical_type is None:
            errors.append(
                f"Relationship {relationship_id} has unsupported type: {relationship.get('type')}."
            )
        direction = normalize_association_direction(relationship.get("direction"))
        if direction is None:
            errors.append(
                f"Relationship {relationship_id} has invalid direction: {relationship.get('direction')}."
            )

        if canonical_type in CARDINALITY_RELATIONSHIP_TYPES:
            for field in ("sourceMultiplicity", "targetMultiplicity"):
                multiplicity = relationship.get(field)
                if multiplicity is not None and not MULTIPLICITY_PATTERN.fullmatch(str(multiplicity).strip()):
                    errors.append(
                        f"Relationship {relationship_id} has invalid {field}: {multiplicity}."
                    )
        if canonical_type in {"inheritance", "realization"} and source_id == target_id:
            errors.append(f"Relationship {relationship_id} cannot target the same class it starts from.")
        if canonical_type == "inheritance" and source_id in class_ids and target_id in class_ids:
            inheritance_graph.setdefault(str(source_id), set()).add(str(target_id))

    visiting: set[str] = set()
    visited: set[str] = set()

    def has_inheritance_cycle(class_id: str) -> bool:
        if class_id in visiting:
            return True
        if class_id in visited:
            return False
        visiting.add(class_id)
        if any(has_inheritance_cycle(parent_id) for parent_id in inheritance_graph.get(class_id, set())):
            return True
        visiting.remove(class_id)
        visited.add(class_id)
        return False

    if any(has_inheritance_cycle(class_id) for class_id in sorted(inheritance_graph)):
        errors.append("Inheritance relationships contain a cycle.")
    return {"valid": not errors, "errors": errors, "matchedRuleId": "VAL_CLASS_MODEL_REFERENCES_001"}


def _drawio_graph_model() -> ET.Element:
    return ET.Element(
        "mxGraphModel",
        {
            "dx": "1422",
            "dy": "794",
            "grid": "1",
            "gridSize": "10",
            "guides": "1",
            "tooltips": "1",
            "connect": "1",
            "arrows": "1",
            "fold": "1",
            "page": "1",
            "pageScale": "1",
            "pageWidth": "1169",
            "pageHeight": "827",
            "math": "0",
            "shadow": "0",
        },
    )


def generate_drawio_xml(class_model: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    validation = validate_class_model(class_model)
    if not validation["valid"]:
        return "", validation

    root = ET.Element("mxfile", {"host": "app.diagrams.net", "type": "device"})
    diagram = ET.SubElement(root, "diagram", {"id": "class-diagram", "name": "Class Diagram"})
    graph = _drawio_graph_model()
    diagram.append(graph)
    graph_root = ET.SubElement(graph, "root")
    ET.SubElement(graph_root, "mxCell", {"id": "0"})
    ET.SubElement(graph_root, "mxCell", {"id": "1", "parent": "0"})

    classes = sorted(
        [item for item in class_model.get("classes", []) if item.get("enabled", True)],
        key=lambda item: str(item.get("name", "")).lower(),
    )
    id_set = {"0", "1"}
    layout = {
        "columns": 3,
        "startX": 80,
        "startY": 80,
        "horizontalGap": 340,
        "verticalGap": 260,
        "classWidth": 240,
        "headerHeight": 32,
        "rowHeight": 22,
        "dividerHeight": 8,
        "minimumClassHeight": 100,
    }

    for index, cls in enumerate(classes):
        attributes = sorted(cls.get("attributes", []), key=lambda item: item.get("name", "").lower())
        methods = sorted(cls.get("methods", []), key=lambda item: (item.get("name", "").lower(), str(item.get("parameters", []))))
        attribute_rows = [f"- {escape(attr['name'])}: {escape(attr.get('type', 'String'))}" for attr in attributes]
        method_rows = [f"+ {escape(method['name'])}(): {escape(method.get('returnType', 'void'))}" for method in methods]
        attribute_section_height = max(len(attribute_rows), 1) * layout["rowHeight"]
        method_section_height = max(len(method_rows), 1) * layout["rowHeight"]
        height = max(
            layout["headerHeight"] + attribute_section_height + method_section_height + layout["dividerHeight"],
            layout["minimumClassHeight"],
        )
        class_id = cls["id"]
        id_set.add(class_id)
        cell = ET.SubElement(
            graph_root,
            "mxCell",
            {
                "id": class_id,
                "value": escape(cls["name"]),
                "style": "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=32;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;rounded=0;whiteSpace=wrap;html=1;",
                "vertex": "1",
                "parent": "1",
            },
        )
        column = index % layout["columns"]
        row = index // layout["columns"]
        ET.SubElement(
            cell,
            "mxGeometry",
            {
                "x": str(layout["startX"] + column * layout["horizontalGap"]),
                "y": str(layout["startY"] + row * layout["verticalGap"]),
                "width": str(layout["classWidth"]),
                "height": str(height),
                "as": "geometry",
            },
        )
        for section_name, y_offset, rows, section_height in [
            ("attributes", layout["headerHeight"], attribute_rows or [" "], attribute_section_height),
            (
                "methods",
                layout["headerHeight"] + attribute_section_height + layout["dividerHeight"],
                method_rows or [" "],
                method_section_height,
            ),
        ]:
            section_id = f"{class_id}_{section_name}"
            id_set.add(section_id)
            section = ET.SubElement(
                graph_root,
                "mxCell",
                {
                    "id": section_id,
                    "value": "<br>".join(rows),
                    "style": "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=8;spacingRight=8;overflow=hidden;rotatable=0;whiteSpace=wrap;html=1;",
                    "vertex": "1",
                    "parent": class_id,
                },
            )
            ET.SubElement(
                section,
                "mxGeometry",
                {
                    "x": "0",
                    "y": str(y_offset),
                    "width": str(layout["classWidth"]),
                    "height": str(section_height),
                    "as": "geometry",
                },
            )

    relationships = sorted(
        [item for item in class_model.get("relationships", []) if item.get("enabled", True)],
        key=lambda item: (
            str(item.get("sourceClassId", "")),
            str(item.get("targetClassId", "")),
            str(item.get("type", "")),
            str(item.get("label", "")),
        ),
    )
    edge_counts: Counter[str] = Counter()
    for relationship in relationships:
        base_id = relationship["id"]
        edge_counts[base_id] += 1
        edge_id = base_id if edge_counts[base_id] == 1 else f"{base_id}_{edge_counts[base_id]:03d}"
        id_set.add(edge_id)
        relationship_type = normalize_relationship_type(relationship.get("type"))
        assert relationship_type is not None
        direction = normalize_association_direction(relationship.get("direction")) or "undirected"
        edge = ET.SubElement(
            graph_root,
            "mxCell",
            {
                "id": edge_id,
                "value": relationship.get("label", ""),
                "style": relationship_drawio_style(relationship_type, direction),
                "edge": "1",
                "parent": "1",
                "source": relationship["sourceClassId"],
                "target": relationship["targetClassId"],
            },
        )
        ET.SubElement(edge, "mxGeometry", {"relative": "1", "as": "geometry"})
        if relationship_type in CARDINALITY_RELATIONSHIP_TYPES:
            for suffix, field, position in (
                ("source_multiplicity", "sourceMultiplicity", "-0.85"),
                ("target_multiplicity", "targetMultiplicity", "0.85"),
            ):
                value = relationship.get(field)
                if value is None:
                    continue
                label_id = f"{edge_id}_{suffix}"
                id_set.add(label_id)
                label = ET.SubElement(
                    graph_root,
                    "mxCell",
                    {
                        "id": label_id,
                        "value": str(value),
                        "style": "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];",
                        "vertex": "1",
                        "connectable": "0",
                        "parent": edge_id,
                    },
                )
                geometry = ET.SubElement(
                    label,
                    "mxGeometry",
                    {"x": position, "relative": "1", "as": "geometry"},
                )
                ET.SubElement(geometry, "mxPoint", {"as": "offset"})

    xml_text = ET.tostring(root, encoding="unicode", short_empty_elements=True)
    xml_validation = validate_drawio_xml(xml_text, class_model)
    return xml_text, xml_validation


def validate_drawio_xml(xml_text: str, class_model: dict[str, Any] | None = None) -> dict[str, Any]:
    errors = []
    try:
        parsed = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        return {"valid": False, "errors": [str(exc)], "matchedRuleId": "VAL_XML_WELL_FORMED_001"}

    ids = []
    for cell in parsed.findall(".//mxCell"):
        cell_id = cell.attrib.get("id")
        if cell_id:
            ids.append(cell_id)
        if cell.attrib.get("vertex") == "1" and cell.find("mxGeometry") is None:
            errors.append(f"Class cell {cell_id} has no geometry.")
        if cell.attrib.get("edge") == "1":
            geometry = cell.find("mxGeometry")
            if geometry is None or geometry.attrib.get("relative") != "1":
                errors.append(f"Edge cell {cell_id} has no relative geometry.")
    duplicates = sorted({item for item in ids if ids.count(item) > 1})
    if duplicates:
        errors.append(f"Duplicate XML IDs: {', '.join(duplicates)}")

    if class_model:
        model_validation = validate_class_model(class_model)
        errors.extend(model_validation["errors"])
        class_ids = {item["id"] for item in class_model.get("classes", []) if item.get("enabled", True)}
        for edge in parsed.findall(".//mxCell[@edge='1']"):
            if edge.attrib.get("source") not in class_ids:
                errors.append(f"Edge {edge.attrib.get('id')} source points to a missing or disabled class.")
            if edge.attrib.get("target") not in class_ids:
                errors.append(f"Edge {edge.attrib.get('id')} target points to a missing or disabled class.")
        for relationship in class_model.get("relationships", []):
            if not relationship.get("enabled", True):
                continue
            relationship_id = relationship.get("id")
            edge = parsed.find(f".//mxCell[@id='{relationship_id}'][@edge='1']")
            if edge is None:
                errors.append(f"Relationship {relationship_id} has no XML edge.")
                continue
            relationship_type = normalize_relationship_type(relationship.get("type"))
            direction = normalize_association_direction(relationship.get("direction"))
            if relationship_type is None or direction is None:
                continue
            expected_style = relationship_drawio_style(relationship_type, direction)
            if edge.attrib.get("style") != expected_style:
                errors.append(f"Relationship {relationship_id} has an incorrect UML edge style.")
            if relationship_type in CARDINALITY_RELATIONSHIP_TYPES:
                for suffix, field in (
                    ("source_multiplicity", "sourceMultiplicity"),
                    ("target_multiplicity", "targetMultiplicity"),
                ):
                    value = relationship.get(field)
                    if value is None:
                        continue
                    label = parsed.find(f".//mxCell[@id='{relationship_id}_{suffix}']")
                    if label is None or label.attrib.get("value") != str(value):
                        errors.append(
                            f"Relationship {relationship_id} is missing its {field} XML label."
                        )
    return {"valid": not errors, "errors": errors, "matchedRuleId": "VAL_XML_DRAWIO_001"}





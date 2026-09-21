# SPL-3 Backend Feature Documentation

> Reference documentation for the backend. Written to avoid re-reading source repeatedly during development.
> Project: AI-powered SRS & UML Class Diagram Generation Platform (IIT, University of Dhaka)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Application Entry Points](#3-application-entry-points)
4. [Rule Engine Pipeline](#4-rule-engine-pipeline) ← **core innovation**
5. [Dictionaries](#5-dictionaries)
6. [Services Layer](#6-services-layer)
7. [Database Models](#7-database-models)
8. [API Endpoints](#8-api-endpoints)
9. [Generation Workflows](#9-generation-workflows)
10. [Authentication & Security](#10-authentication--security)
11. [Billing & Feature Gates](#11-billing--feature-gates)
12. [Testing Strategy](#12-testing-strategy)
13. [Key Constants & Enumerations](#13-key-constants--enumerations)

---

## 1. System Overview

SPL-3 is a **multi-tenant SaaS platform** that takes natural-language software requirement descriptions and automatically generates:

- A structured **Software Requirements Specification (SRS)** document (markdown + JSON)
- **UML Class Diagrams** in draw.io XML format

The platform has two distinct generation engines:

| Engine | Approach | When Used |
|---|---|---|
| **Rule Engine** | Deterministic dictionary + regex pipeline | `rule_v1` API, reproducible outputs |
| **LLM Pipeline** | LangGraph agentic workflow with GPT/Claude/Gemini | `v1` API, richer natural language understanding |

Both engines can produce diagrams and requirements independently or together.

---

## 2. Tech Stack

```
FastAPI >= 0.115        Web framework (async)
SQLAlchemy >= 2.0       ORM (sync session used in services)
Alembic >= 1.14         Database migrations
PostgreSQL              Primary database (psycopg2-binary)
LangChain >= 0.3        LLM abstraction layer
LangGraph >= 1.2        Agentic workflow graphs
Pydantic Settings       Config management (.env)
bcrypt / passlib        Password hashing
PyJWT                   JWT token handling
cryptography >= 44      Fernet encryption for stored AI keys
uvicorn                 ASGI server
pytest >= 8.3           Testing
```

---

## 3. Application Entry Points

### `backend/app/main.py`

FastAPI app factory. Registers:
- Main API router → prefix `/api/v1`
- Rule system router → prefix `/api/rule_v1`
- CORS middleware (configured origins from settings)
- Health endpoints: `GET /health`, `GET /ready`, `GET /`

### `backend/app/core/config.py`

All settings via `pydantic_settings.BaseSettings` (reads from `.env`):

| Setting Key | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `SECRET_KEY` | JWT signing key | required |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime | 30 |
| `CREDENTIAL_ENCRYPTION_KEY` | Fernet key for AI API keys | required |
| `OPENAI_API_KEY` | OpenAI key | optional |
| `ANTHROPIC_API_KEY` | Anthropic key | optional |
| `GOOGLE_API_KEY` | Gemini key | optional |
| `DEFAULT_LLM_PROVIDER` | `openai` / `anthropic` / `google` | `openai` |
| `DEFAULT_LLM_MODEL` | Model name | `gpt-4o` |
| `LLM_TEMPERATURE` | Generation temperature | `0` |
| `EMAIL_DELIVERY_MODE` | `console` / `smtp` | `console` |
| `SMTP_HOST`, `SMTP_PORT` | Email delivery | — |
| `SRSGEN_LOCAL_MODEL_PATH` | Local Qwen model path | optional |

---

## 4. Rule Engine Pipeline

**File**: `backend/app/rule_engine/pipeline.py`
**Constants at top of file**:

```python
RULE_VERSION = "rules_v1"
STAGES = ["input", "clarifications", "final-story", "requirements", "class-model", "xml"]
STAGE_STATUSES = {"DRAFT", "READY_FOR_REVIEW", "APPROVED", "STALE", "FAILED"}
```

### 4.1 Pipeline Stages (in order)

```
raw text
   │
   ▼
normalize_text()          # Unicode, whitespace, CRLF
   │
   ▼
split_sentences()         # regex on . ! ? \n
   │
   ▼
split_clauses()           # ; , and/then conjunctions
   │
   ▼
tokenize()                # word tokens with offsets
   │
   ▼
extract_facts()           # pattern matching → structured facts
   │
   ▼
generate_clarifications() # questions for ambiguous facts
   │
   ▼
apply_answers()           # user answers refine facts
   │
   ▼
generate_final_story()    # atomic user story sections
   │
   ▼
generate_requirements()   # formal FR / NFR / BR statements
   │
   ▼
generate_class_model()    # UML classes, attributes, methods, relationships
   │
   ▼
validate_class_model()    # ID uniqueness, cycle detection, multiplicity check
   │
   ▼
generate_drawio_xml()     # draw.io XML for UML diagram
   │
   ▼
validate_drawio_xml()     # XML structural validation
```

The top-level function `analyze_text(raw_text)` runs all stages and returns a single dict.

### 4.2 normalize_text(text) → dict

- Unicode NFKC normalization
- Collapse multiple spaces/tabs to single space
- Standardize line endings (CRLF/CR → LF)

Returns: `{ "raw": str, "normalized": str }`

### 4.3 split_sentences(text) → list[dict]

Regex split on sentence terminators (`.!?\n`). Each sentence:

```json
{
  "sentence_id": "sentence_001",
  "text": "...",
  "start": 0,
  "end": 42
}
```

### 4.4 split_clauses(sentences) → list[dict]

Splits each sentence on: semicolons, commas, `and`, `then`. Each clause:

```json
{
  "clause_id": "sentence_001_clause_001",
  "sentence_id": "sentence_001",
  "text": "...",
  "start": 0,
  "end": 20
}
```

### 4.5 tokenize(text) → list[dict]

Extracts alphanumeric words with apostrophes. Each token:

```json
{
  "word": "login",
  "start": 5,
  "end": 10
}
```

### 4.6 extract_facts(sentences, clauses) → list[dict]

**This is the core logic.** Applies pattern matching to each clause to produce structured facts.

#### Fact types extracted:

| Fact Type | Trigger Pattern | Output Fields |
|---|---|---|
| `nfr` | NFR keyword match | `category`, `metric`, `target`, `measurable` |
| `active` | `actor modal action [object]` | `actor`, `modal`, `action`, `object`, `condition` |
| `passive` | `object must be action` | `action`, `object` (actor=null) |
| `relationship` | `entity_a [phrase] entity_b` | `source`, `target`, `rel_type`, `cardinality` |
| `pronoun` | pronoun referencing prior entity | `pronoun`, `resolved_entity` |
| `only_constraint` | `Only actor can action object` | `actor`, `action`, `object` |

Each fact includes:
```json
{
  "fact_id": "fact_001",
  "clause_id": "sentence_001_clause_001",
  "fact_type": "active",
  "actor": "user",
  "modal": "can",
  "modal_type": "permission",
  "action": "login",
  "object": "system",
  "condition": null,
  "raw_clause": "..."
}
```

#### Modal classification:
- `permission`: can, may, will
- `obligation`: shall, must, should
- `negative`: cannot, must not, shall not

#### NFR categories (from `nfr_keywords.json`):
`Performance`, `Availability`, `Security`, `Usability`, `Reliability`, `Maintainability`

#### Relationship types (from `relationship_phrases.json`):
`association`, `aggregation`, `composition`, `dependency`, `inheritance`, `realization`

Relationship type aliases (normalized in `RELATIONSHIP_TYPE_ALIASES`):
```python
"generalization" → "inheritance"
"extends"        → "inheritance"
"inherits"       → "inheritance"
"implementation" → "realization"
"implements"     → "realization"
```

### 4.7 generate_clarifications(facts) → list[dict]

Auto-generates questions for incomplete facts. Rules:

| Condition | Generated Question |
|---|---|
| fact has `object` but no `actor` | "Who can {action} the {object}?" |
| fact has `actor` but no `object` | "What can the {actor} {action}?" |
| fact has neither actor nor object | "What does the system do?" |
| `action` is unknown/missing | "What does '{action}' mean in this context?" |
| NFR target is vague / non-numeric | "What measurable target should be used for {category}?" |

Each clarification:
```json
{
  "clarification_id": "clarification_001",
  "fact_id": "fact_001",
  "question": "Who can login to the system?",
  "question_type": "missing_actor"
}
```

### 4.8 apply_answers(facts, answers) → list[dict]

Takes user-provided clarification answers and patches the corresponding facts. Returns updated facts list.

`answers` shape:
```json
[
  {
    "clarification_id": "clarification_001",
    "answer": "The registered user"
  }
]
```

### 4.9 generate_final_story(text, sentences, facts, answers) → dict

Converts facts into atomic user story sections. Uses `business_narrative_patterns.json` for templates. Fallback: `"Actor can Action Object"`.

Returns:
```json
{
  "stories": [
    {
      "story_id": "story_001",
      "text": "As a user, I can login to the system",
      "fact_ids": ["fact_001"]
    }
  ]
}
```

### 4.10 generate_requirements(final_story, facts) → dict

Transforms stories into formal requirement statements:

| Type | Template |
|---|---|
| `functional` (FR) | `"The system shall allow {actor} to {action} the {object}"` |
| `non_functional` (NFR) | `"The system shall satisfy {category} expectations {within target}"` |
| `business_rule` (BR) | Derived from `only`, `contain`, `own` keywords |

Returns:
```json
{
  "functional": [
    {
      "req_id": "FR-001",
      "text": "The system shall allow user to login",
      "source_fact_ids": ["fact_001"],
      "type": "functional"
    }
  ],
  "non_functional": [...],
  "business_rules": [...]
}
```

### 4.11 generate_class_model(requirements, facts, threshold=4) → dict

Extracts UML classes from requirements using a **scoring algorithm**:

| Event | Score |
|---|---|
| Actor mention in requirement | +5 |
| Object mention in requirement | +4 |
| Participation in relationship | +4 each end |

Entities scoring `>= threshold (default 4)` become classes.

**Filters applied**:
- `primitive_attributes.json`: removes `string`, `number`, `id`, `email`, `date`, etc.
- `generic_nouns.json`: removes `data`, `info`, `object`, `entity`, etc.

Each class:
```json
{
  "class_id": "class_user",
  "name": "User",
  "attributes": [
    { "name": "email", "type": "String", "visibility": "private" }
  ],
  "methods": [
    { "name": "login", "return_type": "void", "visibility": "public" }
  ],
  "source_requirement_ids": ["FR-001"]
}
```

Relationships:
```json
{
  "rel_id": "rel_001",
  "source": "class_user",
  "target": "class_order",
  "rel_type": "association",
  "direction": "source-to-target",
  "source_multiplicity": "1",
  "target_multiplicity": "0..*",
  "label": "places",
  "source_requirement_ids": ["FR-002"]
}
```

Valid multiplicity patterns (regex): `^\*|\d+|\d+\.\.(?:\d+|\*)$`
Examples: `1`, `0..*`, `1..5`, `*`

### 4.12 validate_class_model(class_model) → dict

Checks:
- Class ID uniqueness
- All relationship source/target reference existing class IDs
- Multiplicity values match pattern
- No inheritance cycles (DFS)

Returns: `{ "valid": bool, "errors": list[str] }`

### 4.13 generate_drawio_xml(class_model) → tuple[str, dict]

Generates draw.io XML from the validated class model.

**Layout**: 3-column grid. Gaps configurable. Cell width ~180px.

**Class cell structure** (swimlane):
```
┌─────────────────┐
│   ClassName     │  ← header swimlane
├─────────────────┤
│ - attr: Type    │  ← attributes section
├─────────────────┤
│ + method(): R   │  ← methods section
└─────────────────┘
```

**Edge styles per relationship type**:

| Type | Line | Start Arrow | End Arrow |
|---|---|---|---|
| `association` undirected | solid | none | none |
| `association` source-to-target | solid | none | open |
| `association` target-to-source | solid | open | none |
| `association` bidirectional | solid | open | open |
| `composition` | solid | filledDiamond | none |
| `aggregation` | solid | emptyDiamond | none |
| `inheritance` | solid | none | block (open triangle) |
| `dependency` | dashed | none | open |
| `realization` | dashed | none | block (open triangle) |

Returns: `(xml_string, metadata_dict)`

### 4.14 validate_drawio_xml(xml_text, class_model) → dict

Structural XML validation. Checks well-formedness and presence of expected class/relationship elements.

Returns: `{ "valid": bool, "errors": list[str] }`

### 4.15 Helper functions

```python
snake_case(value: str) → str          # "MyClass" → "my_class"
pascal_case(value: str) → str          # "my class" → "MyClass"
normalize_relationship_type(v) → str   # "extends" → "inheritance"
normalize_association_direction(v) → str
relationship_drawio_style(rel_type, direction) → str  # CSS style string
```

---

## 5. Dictionaries

**Path**: `backend/app/dictionaries/v1/`
**Loader**: `backend/app/rule_engine/dictionaries.py`

All dictionaries loaded via `load_dictionaries()` which uses `@lru_cache`. Call `reset_dictionary_cache()` to reload.

| File | Content | Used In |
|---|---|---|
| `action_aliases.json` | 100+ verb synonyms: `adds→add`, `creates→create` | fact extraction, action normalization |
| `action_aliases_extra.json` | Extended verb mappings | same |
| `nfr_keywords.json` | NFR categories with keywords and metric hints | NFR fact extraction |
| `relationship_phrases.json` | 30+ relationship descriptors with their canonical type | relationship fact extraction |
| `relationship_phrases_extra.json` | Extended relationship mappings | same |
| `permission_modals.json` | `can, may, will` | modal classification |
| `obligation_modals.json` | `shall, must, should` | modal classification |
| `negative_modals.json` | `cannot, must not, shall not` | modal classification |
| `quantifiers.json` | `one→1, many→0..*` | cardinality extraction |
| `conditional_markers.json` | `if, when, unless` | condition detection |
| `temporal_markers.json` | Time-based keywords | temporal fact tagging |
| `state_words.json` | State transition words | state fact tagging |
| `primitive_attributes.json` | `string, number, id, email, date...` | class model filter |
| `generic_nouns.json` | `data, info, object, entity...` | class model filter |
| `articles.json` | `a, an, the` | tokenization helper |
| `pronouns.json` | Pronoun → entity mappings | pronoun resolution |
| `business_narrative_patterns.json` | User story templates | story generation |
| `data_type_hints.json` | Attribute name → type hints | attribute type inference |
| `attribute_phrases.json` | Patterns to extract attributes | attribute extraction |

Dictionary API:
```python
load_dictionaries() → dict[str, Any]     # all dicts, cached
get_dictionary(name: str) → Any          # single dict by name
dictionary_names() → list[str]           # available dict names
reset_dictionary_cache()                  # invalidate cache
```

---

## 6. Services Layer

### 6.1 srs_service.py

**Path**: `backend/app/services/srs_service.py`

Orchestrates LLM-based SRS generation using a **LangGraph StateGraph**.

#### State shape
```python
{
  "workspace_id": UUID,
  "project_id": UUID,
  "generation_job_id": UUID,
  "raw_text": str,
  "summary": dict,           # intro, stakeholders, use_cases, glossary
  "extracted": list[dict],   # raw LLM extractions
  "classified": list[dict],  # with type/subtype added
}
```

#### LangGraph nodes (in order)
1. **input_guardrail** — LLM classifies input as low/medium/high risk (prompt injection detection). Blocks high-risk.
2. **sufficiency_check** — LLM validates enough detail exists. Returns questions if insufficient.
3. **summary_extraction** — LLM extracts: introduction, stakeholders, use cases, glossary.
4. **requirement_extraction** — LLM extracts candidate requirements.
5. **requirement_classification** — LLM classifies each as `functional` / `non_functional` + subtype.
6. **document_building** — Combines summary + classified requirements → SRS markdown + JSON.
7. **diagram_generation** (conditional) — Calls `diagram_generation_service` if requested.

#### Prompt templates (defined inline in srs_service.py)
- `SRS_INPUT_GUARDRAIL_PROMPT_TEMPLATE`
- `SRS_REQUIREMENT_SUFFICIENCY_PROMPT_TEMPLATE`
- `SRS_SUMMARY_PROMPT_TEMPLATE`
- `SRS_REQUIREMENT_EXTRACTION_PROMPT_TEMPLATE`
- `SRS_REQUIREMENT_CLASSIFICATION_PROMPT_TEMPLATE`

#### Key functions
```python
create_requirement_intake(db, workspace_id, project_id, user_id, data) → RequirementInput
answer_requirement_clarifications(db, workspace_id, project_id, req_input_id, user_id, answers) → RequirementInput
start_generation_job(db, workspace_id, project_id, user_id, data) → GenerationJob
stream_ai_srs_preview_events(db, workspace_id, project_id, user_id, data) → AsyncGenerator
get_generation_job(db, workspace_id, project_id, job_id) → GenerationJob
get_srs_document(db, workspace_id, project_id, doc_id) → SrsDocument
list_generation_jobs(db, workspace_id, project_id) → list[GenerationJob]
list_srs_documents(db, workspace_id, project_id) → list[SrsDocument]
```

#### Exceptions
```python
SrsError                    # base
InvalidSrsRequestError      # bad input
GenerationJobNotFoundError
SrsDocumentNotFoundError
InvalidLlmSrsOutputError    # LLM response parse failure
SrsPipelineStageError       # stage execution failure
```

---

### 6.2 diagram_generation_service.py

**Path**: `backend/app/services/diagram_generation_service.py`

Generates draw.io UML class diagrams from extracted requirements.

#### ENTITY_STOPWORDS (filtered from class extraction)
`a, an, and, be, by, for, from, if, in, into, it, of, on, or, shall, should, system, support, supports, must, can, allow, allows, that, the, their, this, to, two, within, second, seconds, requirement, requirements`

#### ACTION_VERBS set
Used to identify methods from requirement statements: `add, approve, archive, assign, authenticate, calculate, cancel, capture, change, check, classify, create, ...` (40+ verbs)

#### Supported generation methods
```python
SUPPORTED_METHODS = {"llm", "rule_based"}
DIAGRAM_GENERATION_ROLES = {"owner", "admin", "member"}
```

#### Key functions
```python
generate_class_diagram(db, workspace_id, project_id, user_id, method, req_input_id) → Diagram
generate_class_diagram_llm(db, ...) → dict       # LLM-based extraction
generate_class_diagram_from_requirements(db, ...) → dict  # Rule-based extraction
```

**Rule-based flow**:
1. Load `ExtractedRequirement` records for the project
2. Call `analyze_text()` on all requirement texts
3. Call `generate_class_model()` on extracted facts
4. Call `generate_drawio_xml()` on class model
5. Persist `Diagram` + `DiagramVersion` + `DiagramRequirementLink` records

**LLM-based flow**:
1. Load all requirement texts
2. Call LLM with entity/relationship extraction prompt
3. Parse JSON response into class model structure
4. Call `generate_drawio_xml()` on parsed model
5. Persist same records as rule-based

#### Diagram-requirement linkage
`DiagramRequirementLink` records map each class/relationship element ID to source `ExtractedRequirement` records with confidence scores.

---

### 6.3 diagram_service.py

**Path**: `backend/app/services/diagram_service.py`

CRUD operations for diagram management:

```python
create_diagram(db, workspace_id, project_id, user_id, data) → Diagram
update_diagram(db, workspace_id, project_id, diagram_id, user_id, data) → DiagramVersion
get_diagram_detail(db, workspace_id, project_id, diagram_id) → dict   # includes versions
list_diagrams(db, workspace_id, project_id) → list[Diagram]
list_diagram_requirement_links(db, workspace_id, diagram_id) → list[DiagramRequirementLink]
```

---

### 6.4 llm_service.py

**Path**: `backend/app/services/llm_service.py`

Multi-provider LLM abstraction via LangChain.

#### Providers and clients
| Provider | Client Class | LangChain Backend |
|---|---|---|
| `openai` | `LangChainOpenAIClient` | `ChatOpenAI` |
| `anthropic` | `LangChainAnthropicClient` | `ChatAnthropic` |
| `google` | `LangChainGeminiClient` | `ChatGoogleGenerativeAI` |

#### Protocol
```python
class LlmClient(Protocol):
    provider: str
    model_name: str
    def generate(request: LlmRequest) → LlmResponse: ...
```

#### Data classes
```python
@dataclass
class LlmRequest:
    prompt: str
    purpose: str        # for audit trail

@dataclass
class LlmResponse:
    content: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    response_payload: dict
```

#### Key functions
```python
get_configured_llm_client(settings) → LlmClient
configured_llm_model_name(settings) → str
execute_llm_call(db, client, request, workspace_id, project_id) → LlmResponse
get_or_create_prompt_template(db, name, content) → PromptTemplate
```

`execute_llm_call()` persists an `LlmCall` audit record to the database after each call.

#### Exceptions
```python
LlmConfigurationError   # missing API key
LlmExecutionError       # API failure or timeout
```

---

### 6.5 rule_system_service.py

**Path**: `backend/app/services/rule_system_service.py`

Orchestrates the rule engine pipeline with full **database persistence** and an **approval workflow**.

#### Stage lifecycle
Each stage progresses through statuses:
`DRAFT → READY_FOR_REVIEW → APPROVED`
or can be rolled back: `APPROVED → DRAFT (reopen)`

Stage names: `input`, `clarifications`, `final-story`, `requirements`, `class-model`, `xml`

#### Project management
```python
create_rule_project(db, user_id, data) → RuleProject
update_rule_project(db, project_id, user_id, data) → RuleProject
delete_rule_project(db, project_id, user_id)
```

#### Story input
```python
create_story_revision(db, project_id, user_id, text) → StoryRevision
get_story_revision(db, project_id, revision_id) → StoryRevision
```

#### Pipeline execution functions
```python
run_clarifications(db, project_id, user_id) → dict    # extract facts, generate questions
run_final_story(db, project_id, user_id) → dict       # generate user stories
run_requirements(db, project_id, user_id) → dict      # generate formal requirements
run_class_model(db, project_id, user_id) → dict       # generate UML class model
run_xml(db, project_id, user_id) → dict               # generate draw.io XML
approve_stage(db, project_id, user_id, stage) → dict
reopen_stage(db, project_id, user_id, stage) → dict
```

#### Editing operations (post-generation manual edits)
```python
add_requirement(...)     patch_requirement(...)    delete_requirement(...)
add_class(...)           patch_class(...)          delete_class(...)
add_relationship(...)    patch_relationship(...)   delete_relationship(...)
add_manual_clarification(...)
answer_clarification(...)
patch_clarification(...)
save_manual_xml(db, project_id, user_id, xml_text) → XmlRevision
validate_xml_text(db, project_id, xml_text) → dict
```

#### Audit trail
Every operation logs an `AuditEvent` record with `before`/`after` values.

---

### 6.6 auth_service.py

```python
create_user(db, data) → User
authenticate_user(db, email, password) → User | None
create_access_token(user_id) → str
verify_access_token(token) → dict        # raises if invalid/expired
request_password_reset(db, email)
reset_password(db, token, new_password)
verify_email(db, token)
resend_verification_email(db, user_id)
```

Password hashing: `bcrypt` via `passlib.CryptContext`.
JWT: signed with `SECRET_KEY`, default 30-minute expiry.

---

### 6.7 workspace_service.py

```python
create_organization_workspace(db, user_id, data) → Workspace
get_workspace(db, workspace_id) → Workspace
list_user_workspace_memberships(db, user_id) → list[WorkspaceMember]
get_active_workspace_membership(db, workspace_id, user_id) → WorkspaceMember
require_workspace_role(membership, allowed_roles: set[str])   # raises 403 if not in set
add_member(db, workspace_id, inviter_id, email, role) → WorkspaceMember
remove_member(db, workspace_id, remover_id, target_user_id)
update_member_role(db, workspace_id, updater_id, target_user_id, new_role)
```

Roles (descending authority): `owner > admin > member > viewer`

---

### 6.8 billing_service.py

```python
require_feature_access(db, workspace_id, feature: str)    # raises 403 / 402 if over limit
record_feature_usage(db, workspace_id, feature: str)      # increments UsageCounter
get_workspace_subscription(db, workspace_id) → Subscription
get_usage_summary(db, workspace_id) → dict
```

Features checked:
- `srs_generation` — monthly SRS generation limit
- `ai_diagram_generation` — monthly AI diagram limit
- `manual_diagram_save` — manual diagram saves

---

### 6.9 srsgen_service.py

Local Qwen 1.5-1.8B-Chat inference (optional). Used as fallback when no LLM API key configured.

```python
load_local_model(model_path) → pipeline
generate_srs_local(pipeline, prompt) → str
```

4-bit quantization, max 2048 tokens.

---

### 6.10 credential_crypto.py

```python
encrypt_api_key(plaintext: str, key: bytes) → str    # Fernet symmetric encryption
decrypt_api_key(ciphertext: str, key: bytes) → str
```

Used to store user-provided AI API keys securely in `ai_settings` table.

---

## 7. Database Models

**Path**: `backend/app/db/models/`
All UUID primary keys. All workspace-scoped tables include `workspace_id` for multi-tenant isolation.

### 7.1 User (`user.py`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | String UNIQUE | indexed |
| `hashed_password` | String | bcrypt |
| `full_name` | String | |
| `avatar_url` | String | nullable |
| `status` | Enum | `active`, `inactive` |
| `email_verified` | Boolean | default False |
| `is_platform_admin` | Boolean | super admin flag |
| `created_at` | DateTime UTC | |
| `updated_at` | DateTime UTC | |

### 7.2 Workspace (`workspace.py`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | String | |
| `slug` | String UNIQUE | URL-friendly |
| `type` | Enum | `organization` |
| `owner_id` | FK → User | |
| `status` | Enum | `active`, `inactive` |

### 7.3 WorkspaceMember (junction table via migration)

| Column | Type |
|---|---|
| `workspace_id` | FK → Workspace |
| `user_id` | FK → User |
| `role` | Enum: `owner`, `admin`, `member`, `viewer` |
| `status` | Enum: `active`, `inactive` |

Composite PK: `(workspace_id, user_id)`.

### 7.4 Project (`project.py`)

| Column | Type |
|---|---|
| `id` | UUID PK |
| `workspace_id` | FK → Workspace |
| `name` | String |
| `description` | Text |
| `status` | Enum: `active`, `archived` |
| `created_by_user_id` | FK → User |

### 7.5 RequirementInput (`generation.py`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `workspace_id` | FK | |
| `project_id` | FK → Project | |
| `title` | String 255 | |
| `raw_text` | Text (200KB max) | |
| `clarification_status` | Enum | `not_required`, `pending`, `clarified` |
| `clarifying_questions` | JSON | list of question dicts |
| `clarification_answers` | JSON | list of answer dicts |
| `refined_text` | Text | after clarification |
| `refinement_metadata` | JSON | |
| `created_by_user_id` | FK → User | |

### 7.6 GenerationJob (`generation.py`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `workspace_id` | FK | |
| `project_id` | FK | |
| `requirement_input_id` | FK → RequirementInput | |
| `job_type` | Enum | `srs`, `class_diagram`, `full` |
| `status` | Enum | `pending`, `running`, `completed`, `failed`, `partially_completed` |
| `progress_percent` | Int 0-100 | |
| `generate_class_diagram` | Boolean | |
| `diagram_methods` | JSON | `["llm", "rule_based"]` |
| `result_payload` | JSON | full generation output |
| `error_message` | Text | |
| `started_at` | DateTime | |
| `completed_at` | DateTime | |

### 7.7 SrsDocument (`srs.py`)

| Column | Type |
|---|---|
| `id` | UUID PK |
| `workspace_id` | FK |
| `project_id` | FK |
| `requirement_input_id` | FK |
| `generation_job_id` | FK |
| `title` | String |
| `status` | Enum: `active`, `archived` |
| `content_markdown` | Text |
| `content_json` | JSON |

### 7.8 ExtractedRequirement (`srs.py`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `srs_document_id` | FK | |
| `requirement_code` | String | `FR-001`, `NFR-001`, `BR-001` |
| `requirement_text` | Text | formal statement |
| `requirement_type` | Enum | `functional`, `non_functional` |
| `nfr_subtype` | String | `Security`, `Performance`, etc. |
| `source_trace` | Text | original input snippet |
| `extraction_reason` | Text | |
| `confidence_score` | Float 0-1 | |

### 7.9 Diagram (`diagram.py`)

| Column | Type |
|---|---|
| `id` | UUID PK |
| `workspace_id` | FK |
| `project_id` | FK |
| `title` | String |
| `diagram_type` | Enum: `class`, `sequence`, etc. |
| `source` | Enum: `manual`, `llm`, `rule_based` |
| `status` | Enum: `active`, `archived` |
| `current_version` | Integer |

### 7.10 DiagramVersion (`diagram.py`)

| Column | Type |
|---|---|
| `id` | UUID PK |
| `diagram_id` | FK → Diagram |
| `version_number` | Integer |
| `drawio_xml` | Text |
| `diagram_json` | JSON |

### 7.11 DiagramRequirementLink (`diagram.py`)

| Column | Type |
|---|---|
| `id` | UUID PK |
| `diagram_id` | FK |
| `diagram_element_id` | String (draw.io cell ID) |
| `diagram_element_label` | String |
| `requirement_code` | String (FR-001, etc.) |
| `confidence_score` | Float |
| `link_reason` | Text |

### 7.12 Billing Models (`billing.py`)

**Plan**:

| Column | Type |
|---|---|
| `max_projects` | Integer |
| `max_members` | Integer |
| `monthly_srs_generations` | Integer |
| `monthly_ai_diagram_generations` | Integer |
| `can_generate_srs` | Boolean |
| `can_generate_ai_diagrams` | Boolean |
| `can_export_srs` | Boolean |

**Subscription**: links Workspace → Plan with period dates.

**UsageCounter**: monthly tracking per workspace.

| Column | Type |
|---|---|
| `workspace_id` | FK |
| `period_key` | String `YYYY-MM` |
| `srs_generations` | Integer |
| `ai_diagram_generations` | Integer |
| `manual_diagram_saves` | Integer |

### 7.13 LLM Models (`llm.py`)

**LlmCall**: audit trail for every LLM invocation.

| Column | Type |
|---|---|
| `provider` | String |
| `model_name` | String |
| `prompt` | Text |
| `purpose` | String |
| `response_payload` | JSON |
| `prompt_tokens` | Integer |
| `completion_tokens` | Integer |
| `total_tokens` | Integer |
| `workspace_id` | FK |
| `project_id` | FK |

**PromptTemplate**: cached prompt templates with name + content.

### 7.14 Rule System Models (`rule_system.py` — 309 lines)

Full versioning and audit system for rule engine:

| Model | Purpose |
|---|---|
| `RuleProject` | Container for rule-based generation |
| `StoryRevision` | Versioned input text |
| `Sentence`, `Clause` | Parsed text hierarchy |
| `ExtractedFact` | Facts with extraction metadata |
| `ClarificationQuestion`, `ClarificationAnswer` | Q&A pairs |
| `FinalStoryRevision` | Generated user stories (versioned) |
| `RequirementRevision` | Versioned requirements |
| `Requirement` | Final formal requirement |
| `ClassModelRevision` | Versioned UML class model |
| `ClassDefinition` | Individual UML class |
| `AttributeDefinition` | Class attributes |
| `MethodDefinition` | Class methods |
| `RelationshipDefinition` | UML relationships |
| `XmlRevision` | Generated draw.io XML (versioned) |
| `StageApproval` | Stage approval records |
| `DictionaryVersion`, `DictionaryEntry` | Per-project dictionary overrides |
| `RuleVersion`, `RuleDefinition` | Rule versioning |
| `AuditEvent` | Full audit trail (before/after values) |

---

## 8. API Endpoints

All endpoints under `/api/v1/` require `Authorization: Bearer <jwt>` header (except auth endpoints).

### 8.1 Auth API — `/api/v1/auth`

| Method | Path | Purpose |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Login → returns JWT |
| POST | `/logout` | Token invalidation |
| POST | `/verify-email` | Verify email with token |
| POST | `/resend-verification` | Resend verification email |
| POST | `/reset-password` | Password reset request |
| POST | `/reset-password/confirm` | Apply new password |

### 8.2 Workspace API — `/api/v1/workspaces`

| Method | Path | Required Role |
|---|---|---|
| POST | `/` | authenticated |
| GET | `/` | authenticated (own workspaces) |
| GET | `/{workspace_id}` | member+ |
| PATCH | `/{workspace_id}` | admin+ |
| DELETE | `/{workspace_id}` | owner |
| GET | `/{workspace_id}/members` | member+ |
| POST | `/{workspace_id}/members` | admin+ |
| PATCH | `/{workspace_id}/members/{user_id}` | admin+ |
| DELETE | `/{workspace_id}/members/{user_id}` | admin+ |

### 8.3 Project API — `/api/v1/workspaces/{workspace_id}/projects`

| Method | Path | Required Role |
|---|---|---|
| POST | `/` | member+ |
| GET | `/` | member+ |
| GET | `/{project_id}` | member+ |
| PATCH | `/{project_id}` | admin+ |
| DELETE | `/{project_id}` | admin+ |

### 8.4 SRS API — `/api/v1/workspaces/{workspace_id}/projects/{project_id}/srs`

| Method | Path | Purpose |
|---|---|---|
| POST | `/intake` | Accept requirement text, start clarification flow |
| GET | `/requirements` | List requirement inputs |
| GET | `/requirements/{id}` | Get single requirement input |
| POST | `/clarifications` | Submit clarification answers, trigger generation |
| POST | `/generate` | Start generation job (options: method, diagram) |
| GET | `/jobs` | List generation jobs |
| GET | `/jobs/{id}` | Get job status and result |
| GET | `/documents` | List SRS documents |
| GET | `/documents/{id}` | Get SRS document with requirements |
| POST | `/preview/ai` | Stream SRS generation preview |
| GET | `/preview/events` | SSE stream of generation progress events |

**`POST /intake` request body**:
```json
{
  "title": "E-commerce Platform",
  "raw_text": "Users can browse products...",
  "generate_class_diagram": true,
  "diagram_methods": ["rule_based", "llm"]
}
```

**`POST /clarifications` request body**:
```json
{
  "requirement_input_id": "uuid",
  "answers": [
    { "clarification_id": "clarification_001", "answer": "Registered users" }
  ]
}
```

### 8.5 Diagram API — `/api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams`

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Create diagram (manual draw.io) |
| GET | `/` | List project diagrams |
| GET | `/{diagram_id}` | Get diagram with version history |
| PUT | `/{diagram_id}/versions` | Save new diagram version |
| GET | `/{diagram_id}/requirement-links` | Get traceability links |

### 8.6 Billing API — `/api/v1/billing`

| Method | Path | Purpose |
|---|---|---|
| GET | `/plans` | List available plans |
| GET | `/workspaces/{workspace_id}/subscription` | Current subscription |
| POST | `/workspaces/{workspace_id}/subscription` | Create/update subscription |
| GET | `/workspaces/{workspace_id}/usage` | Monthly usage summary |

### 8.7 Admin API — `/api/v1/admin` (platform admin only)

| Method | Path | Purpose |
|---|---|---|
| GET | `/users` | List all users |
| GET | `/workspaces` | List all workspaces |
| PATCH | `/users/{user_id}` | Update user (status, admin flag) |
| GET | `/stats` | Platform analytics |

### 8.8 AI Settings API — `/api/v1/workspaces/{workspace_id}/ai-settings`

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Get AI provider settings |
| PUT | `/` | Save AI provider settings (encrypts API keys) |

### 8.9 Rule System API — `/api/rule_v1`

| Method | Path | Purpose |
|---|---|---|
| POST | `/projects` | Create rule project |
| GET | `/projects` | List projects |
| GET | `/projects/{id}` | Project detail |
| POST | `/projects/{id}/story` | Create story revision (input text) |
| GET | `/projects/{id}/story` | Get current story |
| POST | `/projects/{id}/stages/{stage}/run` | Execute pipeline stage |
| POST | `/projects/{id}/stages/{stage}/approve` | Approve stage output |
| POST | `/projects/{id}/stages/{stage}/reopen` | Rollback stage |
| GET | `/projects/{id}/clarifications` | List clarifying questions |
| POST | `/projects/{id}/clarifications` | Add manual clarification |
| POST | `/projects/{id}/clarifications/{cid}/answer` | Answer a question |
| GET | `/projects/{id}/requirements` | List requirements |
| POST | `/projects/{id}/requirements` | Add requirement |
| PATCH | `/projects/{id}/requirements/{rid}` | Edit requirement |
| DELETE | `/projects/{id}/requirements/{rid}` | Delete requirement |
| GET | `/projects/{id}/classes` | List classes |
| POST | `/projects/{id}/classes` | Add class |
| PATCH | `/projects/{id}/classes/{cid}` | Edit class |
| DELETE | `/projects/{id}/classes/{cid}` | Delete class |
| GET | `/projects/{id}/relationships` | List relationships |
| POST | `/projects/{id}/relationships` | Add relationship |
| PATCH | `/projects/{id}/relationships/{rid}` | Edit relationship |
| DELETE | `/projects/{id}/relationships/{rid}` | Delete relationship |
| GET | `/projects/{id}/xml` | Get current XML |
| POST | `/projects/{id}/xml` | Save manual XML |
| POST | `/projects/{id}/xml/validate` | Validate XML against class model |

### 8.10 Health API

| Method | Path | Response |
|---|---|---|
| GET | `/health` | `{"status": "ok"}` |
| GET | `/ready` | DB connection check |
| GET | `/` | App info |

---

## 9. Generation Workflows

### 9.1 LLM-based SRS Generation (v1 API)

```
User POST /srs/intake
  → billing check (srs_generation feature)
  → create RequirementInput
  → LLM: input_guardrail (safety)
  → if high-risk → reject 400
  → LLM: sufficiency_check
  → if insufficient → return questions, status=pending
  → LLM: summary_extraction → {intro, stakeholders, use_cases, glossary}
  → LLM: requirement_extraction → [RequirementDraft]
  → LLM: requirement_classification → FR/NFR with subtypes
  → build SrsDocument (markdown + JSON)
  → persist ExtractedRequirement records
  → if generate_class_diagram:
      → diagram_generation_service (llm or rule_based)
      → persist Diagram + DiagramVersion + DiagramRequirementLink
  → update GenerationJob status=completed
  → return job_id
```

### 9.2 Rule-based Pipeline (rule_v1 API)

```
POST /projects/{id}/story        → create StoryRevision (input text)
POST /stages/clarifications/run  → normalize → split → extract_facts → generate_clarifications
                                    → persist ExtractedFact, ClarificationQuestion records
POST /clarifications/{id}/answer → record ClarificationAnswer
POST /stages/final-story/run     → apply_answers → generate_final_story
                                    → persist FinalStoryRevision
POST /stages/requirements/run    → generate_requirements
                                    → persist Requirement records
POST /stages/class-model/run     → generate_class_model
                                    → persist ClassDefinition, AttributeDefinition,
                                       MethodDefinition, RelationshipDefinition
POST /stages/xml/run             → generate_drawio_xml → validate_drawio_xml
                                    → persist XmlRevision
POST /stages/{stage}/approve     → mark stage APPROVED
```

### 9.3 Clarification Workflow Detail

When rule engine identifies ambiguities:

1. `run_clarifications` stage generates `ClarificationQuestion` records
2. Frontend displays questions to user
3. User submits answers via `POST /clarifications/{id}/answer`
4. `run_final_story` calls `apply_answers(facts, answers)` which patches facts
5. Pipeline continues with refined facts

---

## 10. Authentication & Security

### JWT Flow

1. `POST /auth/login` → validates credentials → returns `{ "access_token": "...", "token_type": "bearer" }`
2. Client stores token in localStorage
3. All requests include `Authorization: Bearer <token>` header
4. `deps.py` `get_current_user()` dependency validates token on every request

### Dependency Injection (`backend/app/api/deps.py`)

```python
get_db() → Session               # DB session per request
get_current_user(token) → User   # validates JWT, loads user
get_current_active_user() → User # also checks user.status == active
```

### Multi-Tenant Isolation

Every service function receives `workspace_id` and verifies:
1. The authenticated user is a member of the workspace (`get_active_workspace_membership`)
2. The requested resource belongs to that workspace (SQL WHERE clause includes `workspace_id`)

### Password Security

- Bcrypt hashing via `passlib.CryptContext`
- Salt rounds: bcrypt default (12)
- Password reset tokens: time-limited, single-use

---

## 11. Billing & Feature Gates

### Feature Gate Pattern

```python
# In any service function that requires billing check:
await require_feature_access(db, workspace_id, "srs_generation")
# ... do the work ...
await record_feature_usage(db, workspace_id, "srs_generation")
```

`require_feature_access` raises:
- `403 Forbidden` — feature not in plan
- `402 Payment Required` — monthly limit exceeded

### Plan Features

| Feature Flag | Checked For |
|---|---|
| `can_generate_srs` | Any SRS generation |
| `can_generate_ai_diagrams` | LLM-based diagram generation |
| `can_export_srs` | SRS export (PDF, etc.) |
| `monthly_srs_generations` | Monthly quota enforcement |
| `monthly_ai_diagram_generations` | Monthly quota enforcement |

---

## 12. Testing Strategy

### Unit Tests (`backend/tests/unit/`)

| File | What It Tests |
|---|---|
| `test_rule_pipeline.py` | All pipeline functions: normalize, split, extract, generate, validate, XML |
| `test_diagram_generation_service.py` | Diagram synthesis from requirements |
| `test_srs_pipeline_service.py` | LangGraph SRS pipeline nodes |
| `test_llm_service.py` | LLM client factory and execution |
| `test_srsgen_service.py` | Local Qwen model inference |
| `test_srs_domain.py` | RequirementDraft domain model |
| `test_user_model.py` | User model creation and hashing |
| `fake_llm.py` | Mock LLM client for deterministic test responses |

### Integration Tests (`backend/tests/integration/`)

| File | What It Tests |
|---|---|
| `test_auth_api.py` | Full auth flow (register → verify → login → reset) |
| `test_workspace_api.py` | Workspace CRUD + member management + role enforcement |
| `test_project_api.py` | Project management |
| `test_srs_generation_api.py` | End-to-end SRS generation |
| `test_diagram_api.py` | Diagram CRUD + versioning |
| `test_billing_api.py` | Plans, subscriptions, usage tracking |
| `test_admin_api.py` | Platform admin operations |
| `test_rule_api.py` | Rule system full workflow |
| `test_generation_modes_api.py` | Both llm and rule_based diagram methods |
| `test_full_generation_flow.py` | Input → SRS → Diagram complete flow |

---

## 13. Key Constants & Enumerations

### From `pipeline.py`

```python
RULE_VERSION = "rules_v1"
DICTIONARY_VERSION = "v1"

STAGES = ["input", "clarifications", "final-story", "requirements", "class-model", "xml"]
STAGE_STATUSES = {"DRAFT", "READY_FOR_REVIEW", "APPROVED", "STALE", "FAILED"}

RELATIONSHIP_TYPES = {"association", "aggregation", "composition", "dependency", "inheritance", "realization"}
CARDINALITY_RELATIONSHIP_TYPES = {"association", "aggregation", "composition"}
ASSOCIATION_DIRECTIONS = {"undirected", "source-to-target", "target-to-source", "bidirectional"}

MULTIPLICITY_PATTERN = re.compile(r"^(?:\*|\d+|\d+\.\.(?:\d+|\*))$")
# Valid examples: "1", "0..*", "1..5", "*"
```

### Requirement code prefixes

| Code | Type |
|---|---|
| `FR-NNN` | Functional Requirement |
| `NFR-NNN` | Non-Functional Requirement |
| `BR-NNN` | Business Rule |

### GenerationJob statuses

`pending` → `running` → `completed` / `failed` / `partially_completed`

### Workspace member roles (descending authority)

`owner > admin > member > viewer`

### NFR subtypes

`Performance`, `Availability`, `Security`, `Usability`, `Reliability`, `Maintainability`

### Diagram sources

`manual` (user-drawn in draw.io), `llm` (AI-generated), `rule_based` (deterministic pipeline)

---

*Last updated: 2026-08-29. Source branch: `refac/tailwind-css`.*

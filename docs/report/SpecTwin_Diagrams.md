# SpecTwin report: Mermaid diagrams

Each block matches a figure placeholder in `SpecTwin_Technical_Report.docx`.
All diagrams use `flowchart`, `sequenceDiagram` or `classDiagram`, which Excalidraw
(Mermaid to Excalidraw) imports as editable shapes.

---

## Figure 1: Level 0 Use Case Diagram of SpecTwin

```mermaid
flowchart LR
    U((User))
    A((Super Admin))
    subgraph SYS["SpecTwin"]
        SP([SpecTwin: Generate reviewed SRS and UML class diagram])
    end
    AI((AI Engine))
    DB((Database))
    U --- SP
    A --- SP
    SP --- AI
    SP --- DB
```

## Figure 2: Level 1 Use Case Diagram of SpecTwin

```mermaid
flowchart LR
    U((User))
    A((Super Admin))
    subgraph SYS["SpecTwin"]
        UC1([1. Authentication])
        UC2([2. Workspace and Project Management])
        UC3([3. SRS Generation Pipeline])
        UC4([4. Class Modeler])
        UC5([5. Document and Diagram Management])
        UC6([6. AI Provider Settings])
        UC7([7. Platform Administration])
    end
    AI((AI Engine))
    DB((Database))
    U --- UC1
    U --- UC2
    U --- UC3
    U --- UC4
    U --- UC5
    U --- UC6
    A --- UC1
    A --- UC7
    UC3 --- AI
    UC4 --- AI
    UC1 --- DB
    UC2 --- DB
    UC3 --- DB
    UC5 --- DB
    UC7 --- DB
```

## Figure 3: Level 1.1 Authentication

```mermaid
flowchart LR
    U((User))
    subgraph AUTH["Authentication"]
        R([Register])
        V([Verify Email with Code])
        RS([Resend Verification Code])
        L([Login])
        FP([Forgot Password])
        RP([Reset Password])
        LO([Logout])
    end
    DB((Database))
    EM((Email Service))
    U --- R
    U --- L
    U --- FP
    U --- LO
    R -.->|include| V
    V -.->|extend| RS
    FP -.->|include| RP
    R --- DB
    L --- DB
    RP --- DB
    V --- EM
    RS --- EM
```

## Figure 4: Level 1.2 Workspace and Project Management

```mermaid
flowchart LR
    U((Owner / Admin))
    M((Member))
    subgraph WP["Workspace and Project Management"]
        CW([Create Workspace])
        IM([Invite Member])
        UR([Update Member Role])
        RM([Remove Member])
        CP([Create Project])
        EP([Edit Project])
        AP([Archive Project])
        SW([Search Workspace])
    end
    DB((Database))
    U --- CW
    U --- IM
    U --- UR
    U --- RM
    U --- AP
    M --- CP
    M --- EP
    M --- SW
    CW --- DB
    IM --- DB
    CP --- DB
    SW --- DB
```

## Figure 5: Level 1.3 SRS Generation Pipeline

```mermaid
flowchart LR
    U((User))
    subgraph PIPE["SRS Generation Pipeline"]
        D([Describe System and Choose Engine])
        C([Answer Clarification Questions])
        E([Review and Edit Stage])
        AP([Approve Stage])
        RO([Reopen Stage])
        G([Generate Next Stage])
        VA([Validate Stage Payload])
        PB([Publish SRS and Diagram])
    end
    ENG((Generation Engine))
    RAG((Correction Memory))
    DB((Database))
    U --- D
    U --- C
    U --- E
    U --- AP
    U --- RO
    AP -.->|include| G
    G -.->|include| VA
    AP -.->|extend| PB
    G --- ENG
    E --- RAG
    G --- RAG
    PB --- DB
    E --- DB
```

## Figure 6: Level 1.4 Class Modeler

```mermaid
flowchart LR
    U((User))
    subgraph CMOD["Class Modeler"]
        IT([Enter Requirement Text])
        SM([Select Engine Mode])
        GM([Generate Class Model])
        BD([View Noun and Verb Breakdown])
        ED([Edit Classes and Relationships])
        DX([Export draw.io Diagram])
        CMP([Compare Engine Results])
        SC([Save Correction])
    end
    RE((Rule Engine))
    AI((LLM / Hosted AI))
    RAG((Correction Memory))
    U --- IT
    U --- SM
    U --- BD
    U --- ED
    U --- DX
    U --- CMP
    IT -.->|include| GM
    GM --- RE
    GM --- AI
    ED -.->|extend| SC
    SC --- RAG
```

## Figure 7: Level 1.5 Document and Diagram Management

```mermaid
flowchart LR
    U((User))
    subgraph DOCS["Document and Diagram Management"]
        VD([View SRS Document])
        ED([Edit SRS Document])
        XD([Export SRS Document])
        AD([Archive SRS Document])
        VG([View Class Diagram])
        EG([Edit Diagram in draw.io / Canvas])
        SV([Save New Diagram Version])
        HV([View Version History])
        XG([Export draw.io XML])
    end
    DB((Database))
    U --- VD
    U --- ED
    U --- XD
    U --- AD
    U --- VG
    U --- EG
    U --- HV
    U --- XG
    EG -.->|include| SV
    ED --- DB
    SV --- DB
    HV --- DB
```

## Figure 8: Level 1.6 Platform Administration and AI Settings

```mermaid
flowchart LR
    A((Super Admin))
    U((User))
    subgraph ADM["Administration and AI Settings"]
        VO([View Platform Overview])
        MU([Manage Users and Workspaces])
        VL([Inspect LLM Calls])
        PT([Manage Prompt Templates])
        AL([View Audit Logs])
        PS([Update Platform Settings])
        AK([Add AI Provider Key])
        TK([Test AI Provider Key])
        DK([Delete AI Provider Key])
    end
    DB((Database))
    PR((AI Provider))
    A --- VO
    A --- MU
    A --- VL
    A --- PT
    A --- AL
    A --- PS
    U --- AK
    U --- TK
    U --- DK
    AK -.->|include| TK
    TK --- PR
    MU --- DB
    PS --- DB
    AK --- DB
```

## Figure 9: ER Diagram of SpecTwin

Entities are rectangles, relationships are diamonds, and edge labels give the cardinality.

```mermaid
flowchart LR
    USER[User]
    WS[Workspace]
    WM[WorkspaceMember]
    PRJ[Project]
    RUN[GenerationPipelineRun]
    REV[GenerationStageRevision]
    SRS[SrsDocument]
    DIA[Diagram]
    DV[DiagramVersion]
    LLM[LlmCall]
    PT[PromptTemplate]
    COR[GenerationCorrection]
    CRED[UserAiProviderCredential]
    AUD[AdminAuditLog]

    R1{owns}
    R2{has member}
    R3{contains}
    R4{has}
    R5{versioned as}
    R6{publishes}
    R7{has}
    R8{versioned as}
    R9{links to}
    R10{logs}
    R11{renders}
    R12{source of}
    R13{owns}
    R14{used by}
    R15{acted in}
    R16{is}

    USER ---|1| R1 ---|N| WS
    WS ---|1| R2 ---|N| WM
    USER ---|1| R16 ---|N| WM
    WS ---|1| R3 ---|N| PRJ
    PRJ ---|1| R4 ---|N| RUN
    RUN ---|1| R5 ---|N| REV
    RUN ---|1| R6 ---|0..1| SRS
    PRJ ---|1| R7 ---|N| DIA
    DIA ---|1| R8 ---|N| DV
    SRS ---|N| R9 ---|0..1| DIA
    RUN ---|1| R10 ---|N| LLM
    PT ---|1| R11 ---|N| LLM
    RUN ---|1| R12 ---|N| COR
    USER ---|1| R13 ---|N| CRED
    CRED ---|0..1| R14 ---|N| RUN
    USER ---|1| R15 ---|N| AUD
```

## Figure 10: CRC / Class Diagram of SpecTwin

```mermaid
classDiagram
    class AuthService {
        +register_user()
        +verify_email()
        +resend_verification_code()
        +authenticate_user()
        +request_password_reset()
        +reset_password()
    }
    class WorkspaceService {
        +create_organization_workspace()
        +invite_workspace_member()
        +update_workspace_member_role()
        +remove_workspace_member()
        +require_workspace_role()
    }
    class ProjectService {
        +create_project()
        +list_active_projects()
        +update_project()
        +archive_project()
    }
    class GenerationPipelineService {
        +create_pipeline_run()
        +save_stage_revision()
        +approve_stage()
        +reopen_stage()
        +generate_next_stage()
        +mutate_class_model()
    }
    class RuleEnginePipeline {
        +normalize_text()
        +split_sentences()
        +extract_facts()
        +generate_clarifications()
        +generate_requirements()
        +generate_class_model()
        +generate_drawio_xml()
    }
    class LlmClient {
        <<interface>>
        +generate(request) LlmResponse
    }
    class OllamaClient {
        +generate()
        +embed()
        +warm_up()
    }
    class HostedAiClient {
        +generate()
    }
    class ExternalProviderClient {
        +generate()
    }
    class ClassModelerService {
        +generate_class_model_from_text()
        +normalize_llm_class_model()
        +capture_class_model_correction()
    }
    class OopModeler {
        +analyze_oop_text()
    }
    class RagService {
        +capture_correction()
        +retrieve_corrections()
        +format_corrections_for_prompt()
    }
    class SrsService {
        +publish_pipeline_run()
        +update_srs_document()
        +archive_srs_document()
    }
    class SrsDocumentBuilder {
        +build_srs_document()
    }
    class DiagramService {
        +create_manual_diagram()
        +save_diagram_version()
        +list_diagram_versions()
    }
    class AdminService {
        +platform_overview()
        +log_admin_action()
        +upsert_platform_setting()
    }
    class AiSettingsService {
        +save_ai_credential()
        +test_ai_credential()
        +build_client_for_credential()
    }

    LlmClient <|.. OllamaClient
    LlmClient <|.. HostedAiClient
    LlmClient <|.. ExternalProviderClient
    GenerationPipelineService --> RuleEnginePipeline : rule_based / xml
    GenerationPipelineService --> LlmClient : ollama / ai / byok
    GenerationPipelineService --> RagService : corrections
    GenerationPipelineService --> SrsService : publish
    SrsService --> SrsDocumentBuilder
    SrsService --> DiagramService
    ClassModelerService --> OopModeler
    ClassModelerService --> LlmClient
    ClassModelerService --> RagService
    AiSettingsService --> ExternalProviderClient : builds
    GenerationPipelineService --> ProjectService : project access
    ProjectService --> WorkspaceService : membership
    AuthService --> WorkspaceService : personal workspace
    AdminService --> AuthService : seed super admin
```

## Figure 11: Activity Diagram of the Generation Pipeline

```mermaid
flowchart TD
    S((Start)) --> A[Enter title, description and engine]
    A --> B[Create run and Input stage v1]
    B --> C{Review stage}
    C -->|edit| D[Save new revision and mark later stages stale]
    D --> C
    C -->|approve| E{Validation passes?}
    E -->|no| C
    E -->|yes| F{Last stage XML?}
    F -->|no| G{Next stage is XML or mode is rule_based?}
    G -->|yes| H[Rule engine generates stage]
    G -->|no| I[LLM engine generates stage with past corrections]
    H --> J[Validate payload and store revision]
    I --> J
    J --> C
    F -->|yes| K[Mark run completed]
    K --> L[Build SRS document]
    K --> M[Create or version class diagram]
    L --> N[Save SrsDocument linked to diagram]
    M --> N
    N --> X((End))
```

## Figure 12: Sequence Diagram of a Pipeline Run

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Frontend
    participant API as FastAPI
    participant GPS as GenerationPipelineService
    participant ENG as Engine
    participant RAG as RagService
    participant DB as PostgreSQL

    U->>FE: Describe system, choose engine
    FE->>API: POST /generation-pipelines
    API->>GPS: create_pipeline_run()
    GPS->>DB: Save run and input revision v1
    loop Each stage
        U->>FE: Review or edit artifact
        opt User edits
            FE->>API: POST /stages/{stage}/revisions
            API->>GPS: save_stage_revision()
            GPS->>RAG: capture_correction()
            GPS->>DB: New version, later stages stale
        end
        FE->>API: POST /stages/{stage}/approve
        API->>GPS: approve_stage()
        GPS->>RAG: retrieve_corrections()
        GPS->>ENG: Generate next stage
        ENG-->>GPS: JSON payload
        GPS->>GPS: Validate payload
        GPS->>DB: Store revision (ready_for_review)
        API-->>FE: Updated run
    end
    GPS->>DB: publish_pipeline_run()
    FE-->>U: Open SRS and class diagram
```

## Figure 13: State Diagram of the Generation Pipeline

```mermaid
flowchart TD
    S((Start)) -->|create run| IN
    subgraph RUN["Pipeline run: current stage is ready_for_review"]
        IN["1. Input"]
        CL["2. Clarifications"]
        FS["3. Final Story"]
        RQ["4. Requirements"]
        CM["5. Class Model"]
        XM["6. draw.io XML"]
        IN -->|approve, run running, generate| CL
        CL -->|approve, all questions resolved| FS
        FS -->|approve| RQ
        RQ -->|approve| CM
        CM -->|approve, model valid| XM
    end
    NOTE["In every stage: edit saves a new version; approve validates, then the run is running while the next stage is generated"]
    XM -->|approve, XML valid| DONE["Run completed"]
    DONE -->|publish| PUB["Published: SRS document and class diagram"]
    PUB --> E((End))
    RUN -->|generation error| FAIL["Run failed"]
    FAIL -->|retry| RUN
    PUB -->|reopen a stage| REO["Stage reopened: later stages stale"]
    REO -->|re-approve and regenerate| RUN
```

## Figure 14: Architectural Context Diagram

```mermaid
flowchart TB
    subgraph SUP["Superordinate systems"]
        WEB[Web Browser]
    end
    subgraph ACT["Actors"]
        USR((User / Analyst))
        ADM((Super Admin))
    end
    TS[SpecTwin Platform]
    subgraph SUB["Subordinate systems"]
        PG[(PostgreSQL Database)]
        OL[Ollama Local LLM Server]
        SMTP[SMTP Email Service]
    end
    subgraph PEER["Peer systems"]
        HA[Hosted AI Service]
        BY[OpenAI / Anthropic / Gemini]
        DIO[draw.io Embedded Editor]
    end
    WEB --> TS
    USR --> TS
    ADM --> TS
    TS --> PG
    TS --> OL
    TS --> SMTP
    TS <--> HA
    TS <--> BY
    TS <--> DIO
```

## Figure 15: Archetypes of SpecTwin (Layered View)

```mermaid
flowchart TB
    subgraph PL["Presentation Layer"]
        P1[React SPA: Dashboard, Projects, Generate, Run]
        P2[Class Modeler and Diagram Editors]
        P3[Settings and Admin Console]
    end
    subgraph AL["API Layer"]
        A1[FastAPI Routers /api/v1]
        A2[JWT Auth and Workspace Role Guards]
        A3[Pydantic Schemas]
    end
    subgraph BL["Business Logic Layer"]
        B1[Generation Pipeline Service]
        B2[Rule Engine and OOP Modeler]
        B3[LLM Layer: Ollama, Hosted, BYOK, SrsGen]
        B4[RAG Correction Memory]
        B5[SRS and Diagram Services]
    end
    subgraph DL["Data Layer"]
        D1[SQLAlchemy Models]
        D2[Alembic Migrations]
        D3[(PostgreSQL)]
        D4[JSON Dictionaries and Rules v1]
    end
    PL --> AL
    AL --> BL
    BL --> DL
```

## Figure 16: Top-Level Components

```mermaid
flowchart LR
    subgraph FE["Frontend"]
        UI[React UI]
        CL[Typed API Client]
        DIO[draw.io + Canvas]
    end
    subgraph BE["Backend"]
        AUTH[Auth Module]
        WSP[Workspace and Project Module]
        GEN[Generation Pipeline Module]
        RULE[Rule Engine]
        LLMM[LLM Integration Module]
        RAG[Correction Memory]
        CM[Class Modeler Module]
        PUB[SRS and Diagram Publisher]
        ADMN[Admin Module]
    end
    DB[(PostgreSQL)]
    EXT[AI Providers / Ollama]
    UI --> CL --> AUTH
    CL --> WSP
    CL --> GEN
    CL --> CM
    CL --> PUB
    CL --> ADMN
    UI --- DIO
    GEN --> RULE
    GEN --> LLMM
    GEN --> RAG
    GEN --> PUB
    CM --> RULE
    CM --> LLMM
    CM --> RAG
    LLMM --> EXT
    AUTH --> DB
    WSP --> DB
    GEN --> DB
    PUB --> DB
    ADMN --> DB
    RAG --> DB
```

## Figure 17: Rule-Based Engine Pipeline and Rules

```mermaid
flowchart TD
    RAW[Raw description text] --> N1
    subgraph S1["Stage 1: Input analysis"]
        N1["Normalise text<br/>TXT_UNICODE_NFKC_001<br/>TXT_WHITESPACE_COLLAPSE_001<br/>TXT_PUNCTUATION_ASCII_001<br/>TXT_CONTRACTION_EXPAND_001"]
        N2["Split sentences<br/>SPL_SENTENCE_TERMINATOR_001"]
        N3["Split clauses<br/>SPL_CLAUSE_COMMA_CONJUNCTION_001"]
        N4["Tokenise<br/>TOK_WORD_001"]
        N5["Extract facts: actor, action, object<br/>EXT_ACTION_ALIAS_001, EXT_PASSIVE_OBJECT_ACTION_001<br/>EXT_PASSIVE_WITH_AGENT_001, EXT_PHRASAL_VERB_001"]
        N1 --> N2 --> N3 --> N4 --> N5
    end
    subgraph S2["Stage 2: Clarifications"]
        C1["Missing slot rules<br/>CLR_MISSING_ACTOR / OBJECT / ACTION_001"]
        C2["Vague wording rules<br/>CLR_VAGUE_NFR_TARGET_001<br/>CLR_VAGUE_QUANTIFIER_001<br/>CLR_VAGUE_TIMING_001"]
        C3["Reference and conflict rules<br/>CLR_AMBIGUOUS_PRONOUN_001<br/>CLR_CONFLICTING_MODALITY_001"]
    end
    N5 --> C1
    N5 --> C2
    N5 --> C3
    C1 --> ANS[User answers fill fact slots]
    C2 --> ANS
    C3 --> ANS
    ANS --> F1["Stage 3: Final story<br/>FIN_ATOMIC_STORY_TEMPLATE_001"]
    F1 --> R1["Stage 4: Requirements<br/>FR_ACTOR_ACTION_OBJECT_001<br/>FR_CONDITIONAL_ACTOR_ACTION_OBJECT_001<br/>NFR keyword rules"]
    R1 --> M1["Stage 5: Class model<br/>CLS_CANDIDATE_SCORE_001<br/>ATTR_PRIMITIVE_NOUN_001, REL_PHRASE_DICTIONARY_001<br/>MUL_* multiplicity rules"]
    M1 --> V1{"VAL_CLASS_MODEL_REFERENCES_001"}
    V1 -->|valid| X1["Stage 6: draw.io XML<br/>XML_STABLE_CLASS_ID_001"]
    V1 -->|errors| M1
    X1 --> V2{"VAL_XML_WELL_FORMED_001<br/>VAL_XML_DRAWIO_001"}
    V2 -->|valid| OUT[Approved diagram XML]
    V2 -->|errors| X1
```

## Figure 18: Diagram-Only Generation Pipeline (Class Modeler)

```mermaid
flowchart TD
    T[Requirement text, max 20,000 chars] --> M{Engine mode}
    M -->|rule_based| A1[Classify each sentence]
    A1 --> A2[Collect nouns as candidates with evidence]
    A2 --> A3{Class, attribute or rejected?}
    A3 --> A4[Merge synonyms]
    A4 --> A5[Turn verbs into methods]
    A5 --> A6[Draw relationships and multiplicities]
    A6 --> A7[Pull shared attributes up to parent]
    M -->|llm: Ollama or BYOK| L1[Chunk text and call model]
    M -->|ai: hosted| L2[Single hosted call]
    L1 --> NORM[Normalise LLM output to common model]
    L2 --> NORM
    A7 --> RES[Class model: classes, relationships, enums, breakdown]
    NORM --> RES
    RES --> VAL[Validate model]
    VAL --> XML[Build draw.io XML]
    XML --> VIEW[Diagram, Step-by-step, Classes, draw.io, Compare tabs]
    VIEW --> EXP[Export PNG, SVG, XML, .drawio]
    VIEW --> SAVE[Save to project as a Diagram]
    VIEW -->|edit AI output| COR[Store correction in memory]
```

## Figure 19: Diagram Editing: One Model, Three Editors

```mermaid
flowchart LR
    MODEL[(Class model JSON<br/>stage revision or diagram version)]
    TAB[Classes tab<br/>structured fields]
    DIO[draw.io editor<br/>embedded iframe]
    CAN[Interactive canvas<br/>xyflow]
    SRV[Class model endpoints<br/>/class-model/classes<br/>/class-model/relationships]
    VER[(New revision or<br/>new DiagramVersion)]

    TAB -->|add, edit, delete| SRV
    SRV --> VER
    VER --> MODEL
    MODEL -->|drawioXml.ts: model to XML| DIO
    DIO -->|drawioModel.ts: XML to model| MODEL
    DIO -->|save| VER
    MODEL -->|render| CAN
    CAN -->|move nodes, auto layout| CAN
```

## Figure 20: Exportability of SpecTwin

```mermaid
flowchart LR
    SRS[SRS Document] --> MD[Markdown .md]
    SRS --> PDF[Print / PDF]
    DIA[Saved Diagram] --> DRAWIO[draw.io XML .drawio]
    DIA --> PNG1[PNG / JPEG from draw.io]
    DIA --> PNG2[PNG / SVG from canvas]
    XMLS[XML stage of a run] --> DRAWIO2[class-diagram.drawio]
    XMLS --> PNG3[class-diagram.png]
    CM[Class Modeler result] --> CPNG[PNG]
    CM --> CSVG[SVG]
    CM --> CXML[XML]
    CM --> CDRAWIO[.drawio]
    CM --> PROJ[Save to project]
```

## Figure 21: AI Engineering Architecture

```mermaid
flowchart TD
    REQ[Stage generation request] --> SEL{generation_mode}
    SEL -->|rule_based or xml stage| RULE[Rule engine]
    SEL -->|ollama| OT[Ollama task layer<br/>chunking, JSON schema, retries]
    SEL -->|ai| HA[Hosted AI client<br/>platform key]
    SEL -->|byok| BY[Provider client<br/>OpenAI, Anthropic, Gemini]
    SEL -->|srsgen| SG[SrsGen client<br/>Qwen1.5 + LoRA]

    subgraph PROMPT["Prompt construction"]
        CT[Stage contract: exact keys and values]
        UP[Upstream artifacts: raw text, previous stage, facts]
        PC[Past corrections from RAG]
        GU[Untrusted data guard]
    end
    PROMPT --> HA
    PROMPT --> BY
    PROMPT --> SG
    PROMPT --> OT

    RAGS[(RAG correction memory)] --> PC
    OT --> OL[Ollama server]
    HA --> PARSE
    BY --> PARSE
    SG --> PARSE
    OL --> PARSE[Tolerant JSON parser and repair]
    PARSE -->|fails| FB[Plain-text fallback payload]
    PARSE --> VAL[Stage payload validation]
    FB --> VAL
    RULE --> VAL
    VAL --> REV[(Stage revision)]
    HA --> LOG[(llm_calls audit log)]
    BY --> LOG
    OT --> LOG
```

## Figure 22: Ollama Chunked Generation Flow

```mermaid
flowchart TD
    IN[Stage input] --> SPLIT[split_text / pack_items<br/>chunks sized to num_ctx]
    SPLIT --> CALL[json_task: schema-constrained call<br/>with past corrections]
    CALL --> P{Parses as JSON?}
    P -->|yes| TR{Cut off by num_predict?}
    P -->|no, text returned| REF[Ask model to reformat once]
    REF --> P2{Parses now?}
    P2 -->|yes| OK[Keep chunk result]
    P2 -->|no| FB[Plain-text fallback or clear error]
    TR -->|no| OK
    TR -->|yes| HALF[Split chunk in half, retry up to depth 2]
    HALF --> CALL
    OK --> MERGE[Merge and dedupe chunk results]
    MERGE --> NORM[Normalise into stage payload]
```

## Figure 23: RAG Correction Memory

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant GPS as Pipeline / Class Modeler
    participant RAG as RagService
    participant EMB as Embedder
    participant DB as generation_corrections

    U->>GPS: Edit AI-generated stage and save
    GPS->>RAG: capture_correction(wrong, corrected)
    RAG->>EMB: embed(raw input text)
    EMB-->>RAG: vector + embedder id
    RAG->>DB: store row
    Note over GPS,DB: Later run with similar text
    GPS->>RAG: retrieve_corrections(stage, raw text)
    RAG->>EMB: embed(raw text)
    RAG->>DB: cosine search, same workspace, stage, embedder
    DB-->>RAG: top-k above min similarity
    RAG-->>GPS: past corrections
    GPS->>GPS: add to prompt, trimmed to budget
```

## Figure 24: Deployment Diagram

```mermaid
flowchart LR
    BR[User Browser]
    subgraph HOST["Docker host (docker compose project spl3)"]
        subgraph FEC["frontend container<br/>nginx 1.27-alpine :80"]
            SPA[React build<br/>static files]
        end
        subgraph BEC["backend container<br/>python 3.12-slim :8000"]
            EP[entrypoint: alembic upgrade head<br/>seed super admin]
            API[uvicorn FastAPI app]
        end
        subgraph DBC["db container<br/>postgres 16-alpine :5432"]
            PG[(srs_diagram_platform)]
        end
        subgraph OLC["ollama container :11434<br/>profile docker-ollama"]
            OLM[Ollama models]
        end
        INIT[ollama-init<br/>pulls default model once]
        V1[(volume pgdata)]
        V2[(volume ollama-models)]
    end
    EXT[Hosted AI / OpenAI / Anthropic / Gemini]
    SMTP[SMTP server]

    BR -->|HTTP :5173| SPA
    BR -->|REST /api/v1 :8000| API
    EP --> API
    API --> PG
    PG --- V1
    API -->|host.docker.internal or ollama| OLM
    OLM --- V2
    INIT --> OLM
    API --> EXT
    API --> SMTP
```

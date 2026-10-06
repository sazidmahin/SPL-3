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

## Figure 13: State Diagram of a Stage Revision

```mermaid
flowchart LR
    S((Start)) -->|generated or created| R[ready_for_review]
    R -->|user saves edit, new version| R
    R -->|approve exact version, validation passes| A[approved]
    A -->|reopen, copied as new version| R
    A -->|earlier stage edited or reopened| ST[stale]
    R -->|earlier stage edited or reopened| ST
    ST -->|regenerated after earlier stage re-approved| R
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

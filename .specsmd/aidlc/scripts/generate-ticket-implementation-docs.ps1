Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$specRoot = Join-Path $repoRoot ".specsmd"
$ticketSource = Join-Path $specRoot "backend\06-sprint-wise-feature-tickets.md"
$outputRoot = Join-Path $specRoot "implementation-guides"

if (-not (Test-Path $ticketSource)) {
    throw "Ticket source not found: $ticketSource"
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

$ticketText = Get-Content -Raw $ticketSource
$ticketPattern = '(?ms)^###\s+(TICKET-(\d{3})):\s+(.+?)\r?\n\r?\n\*\*Feature:\*\*\s+(.+?)\r?\n\r?\n\*\*What it does:\*\*\s+(.*?)\r?\n\r?\n---'
$ticketMatches = [regex]::Matches($ticketText, $ticketPattern)

function Get-SprintInfo {
    param([int]$TicketNumber)

    switch ($TicketNumber) {
        { $_ -ge 1 -and $_ -le 5 } { return @{ Sprint = "Sprint 1"; Theme = "Project Foundation" } }
        { $_ -ge 6 -and $_ -le 12 } { return @{ Sprint = "Sprint 2"; Theme = "Authentication and Personal Workspace" } }
        { $_ -ge 13 -and $_ -le 20 } { return @{ Sprint = "Sprint 3"; Theme = "Workspace and Tenant Isolation" } }
        { $_ -ge 21 -and $_ -le 29 } { return @{ Sprint = "Sprint 4"; Theme = "Projects" } }
        { $_ -ge 30 -and $_ -le 39 } { return @{ Sprint = "Sprint 5"; Theme = "Manual Draw.io Diagram Editor" } }
        { $_ -ge 40 -and $_ -le 49 } { return @{ Sprint = "Sprint 6"; Theme = "Plans, Subscriptions, and Usage Limits" } }
        { $_ -ge 50 -and $_ -le 55 } { return @{ Sprint = "Sprint 7"; Theme = "Requirement Input and Generation Jobs" } }
        { $_ -ge 56 -and $_ -le 66 } { return @{ Sprint = "Sprint 8"; Theme = "SRS Generation Pipeline" } }
        { $_ -ge 67 -and $_ -le 76 } { return @{ Sprint = "Sprint 9"; Theme = "Class Diagram Generation" } }
        { $_ -ge 77 -and $_ -le 81 } { return @{ Sprint = "Sprint 10"; Theme = "SRS and Diagram Integration" } }
        { $_ -ge 82 -and $_ -le 87 } { return @{ Sprint = "Sprint 11"; Theme = "Export, Permissions, and Polishing" } }
        { $_ -ge 88 -and $_ -le 95 } { return @{ Sprint = "Sprint 12"; Theme = "Testing and Hardening" } }
        { $_ -ge 96 -and $_ -le 101 } { return @{ Sprint = "Sprint 13"; Theme = "Extended Scope - Super Admin" } }
        default { return @{ Sprint = "Unknown"; Theme = "Unknown" } }
    }
}

function Get-PrimarySpecs {
    param([int]$TicketNumber)

    switch ($TicketNumber) {
        { $_ -ge 1 -and $_ -le 5 } {
            return @(
                ".specsmd/PROJECT_CONTEXT_FOR_CODEX.md",
                ".specsmd/backend/01-backend-setup.md",
                ".specsmd/backend/02-backend-folder-structure.md",
                ".specsmd/architecture/02-monorepo-structure.md",
                ".specsmd/implementation-plan/02-phase-1-foundation.md"
            )
        }
        { $_ -ge 6 -and $_ -le 12 } {
            return @(
                ".specsmd/features/01-authentication.md",
                ".specsmd/features/02-workspaces.md",
                ".specsmd/api/02-auth-api.md",
                ".specsmd/database/01-database-design.md",
                ".specsmd/frontend/03-frontend-pages.md"
            )
        }
        { $_ -ge 13 -and $_ -le 20 } {
            return @(
                ".specsmd/features/02-workspaces.md",
                ".specsmd/api/03-workspace-api.md",
                ".specsmd/architecture/03-multi-tenant-workspace-design.md",
                ".specsmd/database/03-tenant-isolation-rules.md",
                ".specsmd/frontend/03-frontend-pages.md"
            )
        }
        { $_ -ge 21 -and $_ -le 29 } {
            return @(
                ".specsmd/features/03-projects.md",
                ".specsmd/api/04-project-api.md",
                ".specsmd/architecture/03-multi-tenant-workspace-design.md",
                ".specsmd/frontend/03-frontend-pages.md"
            )
        }
        { $_ -ge 30 -and $_ -le 39 } {
            return @(
                ".specsmd/features/04-manual-drawio-diagrams.md",
                ".specsmd/api/06-diagram-api.md",
                ".specsmd/architecture/05-drawio-integration.md",
                ".specsmd/frontend/04-drawio-editor-frontend.md"
            )
        }
        { $_ -ge 40 -and $_ -le 49 } {
            return @(
                ".specsmd/features/07-billing-and-subscription.md",
                ".specsmd/api/07-billing-api.md",
                ".specsmd/database/04-subscription-usage-schema.md",
                ".specsmd/frontend/03-frontend-pages.md"
            )
        }
        { $_ -ge 50 -and $_ -le 55 } {
            return @(
                ".specsmd/features/03-projects.md",
                ".specsmd/features/05-ai-srs-generation.md",
                ".specsmd/api/05-srs-api.md",
                ".specsmd/frontend/03-frontend-pages.md"
            )
        }
        { $_ -ge 56 -and $_ -le 66 } {
            return @(
                ".specsmd/features/05-ai-srs-generation.md",
                ".specsmd/backend/04-srs-pipeline-services.md",
                ".specsmd/api/05-srs-api.md",
                ".specsmd/architecture/04-srs-generation-pipeline.md"
            )
        }
        { $_ -ge 67 -and $_ -le 76 } {
            return @(
                ".specsmd/features/06-class-diagram-generation.md",
                ".specsmd/backend/05-diagram-generator-services.md",
                ".specsmd/api/06-diagram-api.md",
                ".specsmd/architecture/05-drawio-integration.md"
            )
        }
        { $_ -ge 77 -and $_ -le 81 } {
            return @(
                ".specsmd/features/05-ai-srs-generation.md",
                ".specsmd/features/06-class-diagram-generation.md",
                ".specsmd/api/05-srs-api.md",
                ".specsmd/api/06-diagram-api.md",
                ".specsmd/frontend/03-frontend-pages.md"
            )
        }
        { $_ -ge 82 -and $_ -le 87 } {
            return @(
                ".specsmd/features/07-billing-and-subscription.md",
                ".specsmd/features/05-ai-srs-generation.md",
                ".specsmd/features/06-class-diagram-generation.md",
                ".specsmd/frontend/03-frontend-pages.md"
            )
        }
        { $_ -ge 88 -and $_ -le 95 } {
            return @(
                ".specsmd/architecture/03-multi-tenant-workspace-design.md",
                ".specsmd/features/05-ai-srs-generation.md",
                ".specsmd/features/06-class-diagram-generation.md",
                ".specsmd/backend/02-backend-folder-structure.md"
            )
        }
        { $_ -ge 96 -and $_ -le 101 } {
            return @(
                ".specsmd/Extended-Scopes/01-extended-scope-super-admin.md",
                ".specsmd/database/01-database-design.md",
                ".specsmd/database/05-super-admin.md",
                ".specsmd/api/01-api-overview.md",
                ".specsmd/architecture/03-multi-tenant-workspace-design.md"
            )
        }
        default { return @(".specsmd/PROJECT_CONTEXT_FOR_CODEX.md") }
    }
}

function Get-Dependencies {
    param([int]$TicketNumber)

    $deps = @()

    if ($TicketNumber -gt 1) {
        $deps += ("TICKET-{0:D3}" -f ($TicketNumber - 1))
    }

    switch ($TicketNumber) {
        5 { $deps = @("TICKET-004") }
        7 { $deps = @("TICKET-003", "TICKET-004", "TICKET-006") }
        8 { $deps = @("TICKET-007") }
        9 { $deps = @("TICKET-007", "TICKET-008") }
        10 { $deps = @("TICKET-006", "TICKET-007") }
        11 { $deps = @("TICKET-010", "TICKET-013", "TICKET-014") }
        12 { $deps = @("TICKET-007", "TICKET-010", "TICKET-011") }
        15 { $deps = @("TICKET-013", "TICKET-014", "TICKET-010") }
        16 { $deps = @("TICKET-013", "TICKET-014", "TICKET-010") }
        17 { $deps = @("TICKET-013", "TICKET-014", "TICKET-010") }
        18 { $deps = @("TICKET-017") }
        19 { $deps = @("TICKET-013", "TICKET-014", "TICKET-017") }
        20 { $deps = @("TICKET-015", "TICKET-016", "TICKET-017") }
        22 { $deps = @("TICKET-021", "TICKET-017") }
        23 { $deps = @("TICKET-021", "TICKET-017", "TICKET-019") }
        24 { $deps = @("TICKET-021", "TICKET-017", "TICKET-019") }
        25 { $deps = @("TICKET-021", "TICKET-017", "TICKET-018", "TICKET-019") }
        26 { $deps = @("TICKET-021", "TICKET-017", "TICKET-018", "TICKET-019") }
        27 { $deps = @("TICKET-023", "TICKET-020") }
        28 { $deps = @("TICKET-022", "TICKET-020") }
        29 { $deps = @("TICKET-024", "TICKET-027") }
        30 { $deps = @("TICKET-021", "TICKET-019") }
        31 { $deps = @("TICKET-030") }
        32 { $deps = @("TICKET-030", "TICKET-031", "TICKET-017", "TICKET-019") }
        33 { $deps = @("TICKET-030", "TICKET-031", "TICKET-032") }
        34 { $deps = @("TICKET-030", "TICKET-017", "TICKET-019") }
        35 { $deps = @("TICKET-030", "TICKET-031", "TICKET-017", "TICKET-019") }
        36 { $deps = @("TICKET-031", "TICKET-035") }
        37 { $deps = @("TICKET-002") }
        38 { $deps = @("TICKET-033", "TICKET-037") }
        39 { $deps = @("TICKET-032", "TICKET-037", "TICKET-038") }
        40 { $deps = @("TICKET-004", "TICKET-005") }
        41 { $deps = @("TICKET-013", "TICKET-040") }
        42 { $deps = @("TICKET-041", "TICKET-040") }
        43 { $deps = @("TICKET-040", "TICKET-041") }
        44 { $deps = @("TICKET-040", "TICKET-041") }
        45 { $deps = @("TICKET-042", "TICKET-044") }
        46 { $deps = @("TICKET-014", "TICKET-041", "TICKET-044") }
        47 { $deps = @("TICKET-040", "TICKET-041", "TICKET-042", "TICKET-044", "TICKET-045") }
        48 { $deps = @("TICKET-047") }
        49 { $deps = @("TICKET-047", "TICKET-020") }
        50 { $deps = @("TICKET-021", "TICKET-019") }
        51 { $deps = @("TICKET-021", "TICKET-019") }
        52 { $deps = @("TICKET-050", "TICKET-017", "TICKET-019") }
        53 { $deps = @("TICKET-051", "TICKET-052", "TICKET-044", "TICKET-045") }
        54 { $deps = @("TICKET-051", "TICKET-053") }
        55 { $deps = @("TICKET-053", "TICKET-054") }
        56 { $deps = @("TICKET-004", "TICKET-005") }
        57 { $deps = @("TICKET-004", "TICKET-005", "TICKET-058") }
        58 { $deps = @("TICKET-056", "TICKET-057") }
        59 { $deps = @("TICKET-058", "TICKET-056") }
        60 { $deps = @("TICKET-058", "TICKET-056") }
        61 { $deps = @("TICKET-060") }
        62 { $deps = @("TICKET-004", "TICKET-005", "TICKET-064") }
        63 { $deps = @("TICKET-060", "TICKET-061", "TICKET-062") }
        64 { $deps = @("TICKET-059", "TICKET-060", "TICKET-061", "TICKET-062", "TICKET-063") }
        65 { $deps = @("TICKET-044", "TICKET-045", "TICKET-052", "TICKET-053", "TICKET-064") }
        66 { $deps = @("TICKET-054", "TICKET-065") }
        67 { $deps = @("TICKET-030", "TICKET-031") }
        68 { $deps = @("TICKET-067") }
        69 { $deps = @("TICKET-063", "TICKET-067", "TICKET-068") }
        70 { $deps = @("TICKET-058", "TICKET-067", "TICKET-068", "TICKET-069") }
        71 { $deps = @("TICKET-069") }
        72 { $deps = @("TICKET-067", "TICKET-068", "TICKET-069", "TICKET-071") }
        73 { $deps = @("TICKET-067", "TICKET-069") }
        74 { $deps = @("TICKET-044", "TICKET-045", "TICKET-068", "TICKET-070", "TICKET-072", "TICKET-073") }
        75 { $deps = @("TICKET-030", "TICKET-031", "TICKET-074") }
        76 { $deps = @("TICKET-037", "TICKET-074", "TICKET-075") }
        77 { $deps = @("TICKET-065", "TICKET-074") }
        78 { $deps = @("TICKET-063", "TICKET-075") }
        79 { $deps = @("TICKET-078") }
        80 { $deps = @("TICKET-077", "TICKET-055", "TICKET-066") }
        81 { $deps = @("TICKET-066", "TICKET-076", "TICKET-080") }
        82 { $deps = @("TICKET-047", "TICKET-062") }
        83 { $deps = @("TICKET-047", "TICKET-030", "TICKET-031") }
        84 { $deps = @("TICKET-047", "TICKET-048", "TICKET-049") }
        85 { $deps = @("TICKET-047", "TICKET-084") }
        86 { $deps = @("TICKET-017", "TICKET-044", "TICKET-045", "TICKET-065", "TICKET-074") }
        87 { $deps = @("TICKET-057", "TICKET-062", "TICKET-075", "TICKET-077") }
        88 { $deps = @("TICKET-017", "TICKET-019", "TICKET-021", "TICKET-030", "TICKET-062") }
        89 { $deps = @("TICKET-044", "TICKET-045", "TICKET-065", "TICKET-074") }
        90 { $deps = @("TICKET-046") }
        91 { $deps = @("TICKET-059", "TICKET-060", "TICKET-061", "TICKET-064") }
        92 { $deps = @("TICKET-070", "TICKET-071", "TICKET-072", "TICKET-073") }
        93 { $deps = @("TICKET-032", "TICKET-033", "TICKET-035", "TICKET-036", "TICKET-039") }
        94 { $deps = @("TICKET-065", "TICKET-074", "TICKET-075", "TICKET-077", "TICKET-081") }
        95 { $deps = @("TICKET-001", "TICKET-094") }
        96 { $deps = @("TICKET-006") }
        97 { $deps = @("TICKET-005", "TICKET-096") }
        98 { $deps = @("TICKET-005") }
        99 { $deps = @("TICKET-003", "TICKET-006", "TICKET-096") }
        100 { $deps = @("TICKET-010", "TICKET-096") }
        101 { $deps = @("TICKET-047", "TICKET-057", "TICKET-097", "TICKET-098", "TICKET-100") }
    }

    return $deps | Select-Object -Unique
}

function Get-Workstreams {
    param([int]$TicketNumber)

    switch ($TicketNumber) {
        { $_ -le 5 } { return @("Backend foundation", "Configuration", "Developer tooling") }
        { $_ -ge 6 -and $_ -le 11 } { return @("Backend domain model", "Authentication API", "Workspace bootstrap") }
        12 { return @("Frontend auth pages", "API integration", "Session handling") }
        { $_ -ge 13 -and $_ -le 19 } { return @("Backend domain model", "Access control", "Tenant isolation") }
        20 { return @("Frontend workspace UX", "State management", "Permission-aware navigation") }
        { $_ -ge 21 -and $_ -le 26 } { return @("Project domain model", "Workspace-scoped API", "Soft-delete and validation") }
        { $_ -ge 27 -and $_ -le 29 } { return @("Frontend project UX", "Workspace-aware API integration", "Project navigation") }
        { $_ -ge 30 -and $_ -le 36 } { return @("Diagram persistence", "Workspace-scoped API", "Versioned XML storage") }
        { $_ -ge 37 -and $_ -le 39 } { return @("Draw.io frontend integration", "Editor workflow", "Save/load UX") }
        { $_ -ge 40 -and $_ -le 47 } { return @("Subscription data model", "Billing rules", "Service-layer enforcement") }
        { $_ -ge 48 -and $_ -le 49 } { return @("Frontend billing UX", "Plan presentation", "Workspace billing context") }
        { $_ -ge 50 -and $_ -le 55 } { return @("Requirement input model", "Job orchestration", "Frontend generation status") }
        { $_ -ge 56 -and $_ -le 65 } { return @("SRS pipeline services", "Persistence", "Protected generation workflow") }
        66 { return @("Frontend SRS review", "Generation result display", "Review workflow") }
        { $_ -ge 67 -and $_ -le 75 } { return @("Diagram generator architecture", "Generation services", "Draw.io XML output") }
        76 { return @("Frontend editor handoff", "Generated diagram editing", "Diagram persistence integration") }
        { $_ -ge 77 -and $_ -le 81 } { return @("Cross-pipeline orchestration", "Traceability", "Integrated review UX") }
        { $_ -ge 82 -and $_ -le 87 } { return @("Feature gating", "Export and metadata", "Error and audit polish") }
        { $_ -ge 88 -and $_ -le 95 } { return @("Automated testing", "Hardening", "Documentation quality") }
        { $_ -ge 96 -and $_ -le 101 } { return @("Platform admin model", "Admin authorization", "Auditability") }
        default { return @("Implementation") }
    }
}

function Get-ImplementationSteps {
    param(
        [int]$TicketNumber,
        [string]$TicketId,
        [string]$Title,
        [string]$Feature
    )

    switch ($TicketNumber) {
        { $_ -le 5 } {
            return @(
                "Create or refine the base project structure in `backend/` so later modules can plug into a stable app layout.",
                "Add the configuration or tooling required by this ticket without pulling later domain models into scope.",
                "Wire the new foundation piece into the FastAPI startup path, developer scripts, or migration tooling as appropriate.",
                "Verify local developer flow for this layer with a focused smoke check."
            )
        }
        { $_ -ge 6 -and $_ -le 11 } {
            return @(
                "Define the backend data structures and schemas required for $Feature, keeping field names aligned with the auth and workspace specs.",
                "Implement service-layer behavior so registration, login, or current-user access remains the single place where auth rules are enforced.",
                "Expose or update the FastAPI route under `/api/v1/auth` and keep response shapes stable for frontend consumers.",
                "Add focused validation and happy-path plus failure-path tests for the affected authentication flow."
            )
        }
        12 {
            return @(
                "Create `LoginPage` and `RegisterPage` views plus any shared auth form components in the frontend structure.",
                "Connect form submission to the auth API contracts, including token handling, loading states, and field-level errors.",
                "Persist authenticated session state in a reusable client-side store or context for the rest of the app.",
                "Verify route navigation for success, invalid credentials, and duplicate-registration scenarios."
            )
        }
        { $_ -ge 13 -and $_ -le 19 } {
            return @(
                "Model workspace and membership rules in the backend with explicit tenant-boundary fields and role/state flags.",
                "Implement repository and dependency logic so every workspace-sensitive operation resolves membership before business work runs.",
                "Apply `workspace_id` scoping consistently across queries and route handlers called by this ticket.",
                "Add tests that prove users cannot access data outside the current workspace context."
            )
        }
        20 {
            return @(
                "Build workspace-selection UI that shows personal and organization workspaces using the authenticated user's workspace list.",
                "Store the active workspace in shared client state and propagate it to project, billing, SRS, and diagram routes.",
                "Guard actions and labels based on membership role so the UI matches backend permissions.",
                "Verify switching between workspaces refreshes all workspace-scoped data correctly."
            )
        }
        { $_ -ge 21 -and $_ -le 26 } {
            return @(
                "Add the project domain model or API changes in the backend while keeping all reads and writes scoped by `workspace_id`.",
                "Introduce request/response schemas that match the project API spec and support creation, update, listing, detail, or archive flow.",
                "Use service or repository boundaries to centralize business rules such as active-status filtering and mutation permissions.",
                "Cover the route with tests for valid workspace access, missing project, and forbidden access."
            )
        }
        { $_ -ge 27 -and $_ -le 29 } {
            return @(
                "Create the project-facing frontend page or route described by this ticket using the workspace-aware API contract.",
                "Handle loading, empty, success, and error states in a way that keeps the active workspace context visible.",
                "Link the page into the dashboard and project navigation flow so downstream SRS and diagram actions remain reachable.",
                "Verify navigation from workspace selection into project list, project creation, and project detail flows."
            )
        }
        { $_ -ge 30 -and $_ -le 36 } {
            return @(
                "Define or extend the diagram persistence model so Draw.io XML and diagram metadata live in workspace-scoped tables.",
                "Implement the FastAPI endpoint behavior for create, load, list, save-version, or version-history use cases from the diagram API spec.",
                "Keep version increments, `current_version` updates, and project ownership checks inside one service boundary.",
                "Add tests for XML persistence, version ordering, and cross-workspace access rejection."
            )
        }
        { $_ -ge 37 -and $_ -le 39 } {
            return @(
                "Integrate Draw.io into the frontend through a dedicated editor page or component that owns load and save communication.",
                "Translate backend diagram data into the editor bootstrapping flow and send updated XML back through the save API.",
                "Preserve version-awareness and unsaved-change behavior so editing feels stable across reloads.",
                "Verify create, open, edit, and save flows against the manual diagram API endpoints."
            )
        }
        { $_ -ge 40 -and $_ -le 47 } {
            return @(
                "Introduce the plan, subscription, or usage data model and migration state required by this billing ticket.",
                "Implement backend service logic so paid-feature checks run before SRS, AI diagram, or member-invite actions.",
                "Expose or update billing endpoints only after the service layer can return consistent plan, subscription, and usage data.",
                "Add tests for allowed, blocked, and limit-exceeded cases so billing rules stay trustworthy."
            )
        }
        { $_ -ge 48 -and $_ -le 49 } {
            return @(
                "Build the billing-facing frontend page using the workspace-scoped billing API contracts.",
                "Show plan names, limits, usage, and upgrade affordances without leaking implementation details of the billing provider.",
                "Reflect permission state in the UI so users understand which features are free, paid, or blocked by limits.",
                "Verify behavior for personal and organization workspaces with different plans."
            )
        }
        { $_ -ge 50 -and $_ -le 55 } {
            return @(
                "Create the requirement input or generation job persistence/model layer needed for the generation workflow.",
                "Implement API orchestration so requirement submission, job creation, and job-status retrieval stay workspace- and project-scoped.",
                "If this ticket is frontend-facing, wire the generation status view to polling or refresh behavior that matches job states.",
                "Add tests that cover creation, status transitions, and permission checks across project boundaries."
            )
        }
        { $_ -ge 56 -and $_ -le 66 } {
            return @(
                "Implement the SRS pipeline component, storage model, or protected API path described by this ticket using the staged architecture from the specs.",
                "Keep prompt/template access, LLM calling, extraction, classification, and document assembly isolated behind service interfaces.",
                "Persist intermediate and final outputs with enough structure to support review, traceability, and retry flows later.",
                "Add component or route tests that validate both the expected output shape and failure handling for malformed or blocked inputs."
            )
        }
        { $_ -ge 67 -and $_ -le 76 } {
            return @(
                "Add the generator abstraction, registry entry, diagram context builder, or XML builder required by this ticket.",
                "Ensure both LLM-based and rule-based paths can plug into the same normalized diagram-generation contract.",
                "Persist generated diagrams through the existing diagram/version model and keep workspace/project ownership checks intact.",
                "Add tests that exercise output normalization, XML generation, and generator selection logic."
            )
        }
        { $_ -ge 77 -and $_ -le 81 } {
            return @(
                "Connect the SRS and class-diagram flows so one request can orchestrate both pipelines without duplicating validation logic.",
                "Store traceability or combined artifact data in a way that supports later review and editing flows.",
                "Expose integrated API or UI behavior only after individual SRS and diagram pieces remain independently testable.",
                "Add integration coverage for partial-failure and success cases across the combined workflow."
            )
        }
        { $_ -ge 82 -and $_ -le 87 } {
            return @(
                "Implement the export, feature-gating, error, or metadata behavior in the layer named by this ticket without expanding scope into unrelated billing or generation logic.",
                "Keep permission checks centralized so UI guards and backend enforcement stay aligned.",
                "Use consistent response shapes and audit fields so later debugging and support workflows remain practical.",
                "Add targeted tests or UI checks for blocked, allowed, and degraded scenarios."
            )
        }
        { $_ -ge 88 -and $_ -le 95 } {
            return @(
                "Add the automated tests or documentation updates described by this ticket using the existing backend and frontend structure.",
                "Focus on realistic workflows and edge cases named in the spec rather than synthetic coverage with little business value.",
                "Keep fixtures and test helpers reusable so later tickets can extend them without duplicating setup.",
                "Verify the updated docs or tests still align with the current API contracts, workspace rules, and generation architecture."
            )
        }
        { $_ -ge 96 -and $_ -le 101 } {
            return @(
                "Implement the platform-admin model, seed flow, dependency, or API described by this ticket while keeping it separate from workspace membership roles.",
                "Use dedicated `/api/v1/admin` behavior for privileged access and preserve `workspace_id` scoping on normal application routes.",
                "Log sensitive admin actions or configuration changes where the extended-scope spec requires auditability.",
                "Add focused tests for allowed admin access, denied non-admin access, and the expected platform-side side effects."
            )
        }
        default {
            return @(
                "Implement $Title in the module implied by the spec.",
                "Keep the change scoped to the ticket and align route, model, and UI behavior with the surrounding specs.",
                "Add focused validation and verification for the new behavior."
            )
        }
    }
}

function Get-Deliverables {
    param([int]$TicketNumber)

    switch ($TicketNumber) {
        { $_ -le 5 } { return @("Config files updated", "Base backend or repo structure in place", "Smoke-check instructions documented") }
        { $_ -ge 6 -and $_ -le 19 } { return @("SQLAlchemy models and/or migrations", "Pydantic schemas", "FastAPI route or dependency updates", "Focused backend tests") }
        { $_ -ge 20 -and $_ -le 20 } { return @("Workspace switcher page or component", "Shared workspace state", "Frontend interaction checks") }
        { $_ -ge 21 -and $_ -le 26 } { return @("Project model/service/repository changes", "Workspace-scoped project endpoints", "Backend tests") }
        { $_ -ge 27 -and $_ -le 29 } { return @("Project pages or components", "API client integration", "Route wiring") }
        { $_ -ge 30 -and $_ -le 36 } { return @("Diagram data model changes", "Diagram/version endpoints", "Persistence tests") }
        { $_ -ge 37 -and $_ -le 39 } { return @("Draw.io UI integration", "Save/load frontend flow", "Manual diagram UX verification") }
        { $_ -ge 40 -and $_ -le 47 } { return @("Billing data models or services", "Subscription/usage enforcement", "Billing API coverage") }
        { $_ -ge 48 -and $_ -le 49 } { return @("Billing frontend pages", "Plan and usage presentation", "Workspace-aware UI state") }
        { $_ -ge 50 -and $_ -le 55 } { return @("Requirement or job models", "Generation workflow endpoints", "Status tests or UI coverage") }
        { $_ -ge 56 -and $_ -le 66 } { return @("SRS pipeline component or model", "Protected SRS generation behavior", "Pipeline or review verification") }
        { $_ -ge 67 -and $_ -le 76 } { return @("Generator abstractions or implementations", "Draw.io XML output", "Diagram persistence integration") }
        { $_ -ge 77 -and $_ -le 81 } { return @("Combined generation orchestration", "Traceability or review data", "Integration coverage") }
        { $_ -ge 82 -and $_ -le 87 } { return @("Permission-aware UX or backend enforcement", "Export or metadata support", "Polish-level validation") }
        { $_ -ge 88 -and $_ -le 95 } { return @("Automated tests or docs updates", "Regression coverage", "Updated developer guidance") }
        { $_ -ge 96 -and $_ -le 101 } { return @("Platform admin data model or API", "Admin-only authorization flow", "Audit or bootstrap coverage") }
        default { return @("Implementation artifact") }
    }
}

function Get-TestPlan {
    param([int]$TicketNumber)

    switch ($TicketNumber) {
        { $_ -le 5 } { return @("Import/startup smoke check", "Configuration validation", "Developer setup verification") }
        { $_ -ge 6 -and $_ -le 19 } { return @("Model or migration tests", "Route or dependency tests", "Unauthorized access cases") }
        { $_ -ge 20 -and $_ -le 20 } { return @("Component rendering test", "Active workspace switch flow", "Permission-state check") }
        { $_ -ge 21 -and $_ -le 36 } { return @("Workspace-scoped API tests", "Validation errors", "Not-found and forbidden cases") }
        { $_ -ge 37 -and $_ -le 39 } { return @("Frontend interaction test", "Manual QA with Draw.io flow", "Save/reload check") }
        { $_ -ge 40 -and $_ -le 47 } { return @("Billing rule unit tests", "Plan limit edge cases", "Endpoint response checks") }
        { $_ -ge 48 -and $_ -le 49 } { return @("Page rendering test", "API integration state checks", "Upgrade-path UI review") }
        { $_ -ge 50 -and $_ -le 55 } { return @("Job lifecycle tests", "Project access checks", "Status transition verification") }
        { $_ -ge 56 -and $_ -le 66 } { return @("Pipeline unit tests", "Persistence assertions", "Failure-path coverage") }
        { $_ -ge 67 -and $_ -le 76 } { return @("Generator unit tests", "XML output assertions", "Persistence integration tests") }
        { $_ -ge 77 -and $_ -le 81 } { return @("End-to-end orchestration test", "Partial failure case", "Review-screen verification") }
        { $_ -ge 82 -and $_ -le 87 } { return @("Permission and gating tests", "Export or metadata checks", "Error-state verification") }
        { $_ -ge 88 -and $_ -le 95 } { return @("Regression suite execution", "Coverage review", "Doc accuracy spot-check") }
        { $_ -ge 96 -and $_ -le 101 } { return @("Admin authorization tests", "Seed/bootstrap verification", "Audit-log or settings persistence checks") }
        default { return @("Focused verification") }
    }
}

$indexLines = @(
    "# Ticket Implementation Guides",
    "",
    "Generated from `.specsmd/backend/06-sprint-wise-feature-tickets.md` and the surrounding SpecsMD source files.",
    "",
    "## Tickets",
    ""
)

foreach ($match in $ticketMatches) {
    $ticketId = $match.Groups[1].Value
    $ticketNumber = [int]$match.Groups[2].Value
    $title = $match.Groups[3].Value.Trim()
    $feature = $match.Groups[4].Value.Trim()
    $whatItDoes = ($match.Groups[5].Value -replace '\r?\n', ' ' -replace '\s+', ' ').Trim()
    $sprintInfo = Get-SprintInfo -TicketNumber $ticketNumber
    $dependencies = Get-Dependencies -TicketNumber $ticketNumber
    $specs = Get-PrimarySpecs -TicketNumber $ticketNumber
    $steps = Get-ImplementationSteps -TicketNumber $ticketNumber -TicketId $ticketId -Title $title -Feature $feature
    $deliverables = Get-Deliverables -TicketNumber $ticketNumber
    $tests = Get-TestPlan -TicketNumber $ticketNumber
    $workstreams = Get-Workstreams -TicketNumber $ticketNumber

    $docLines = @(
        "# $ticketId Implementation",
        "",
        "## Overview",
        "",
        "- Ticket: $ticketId",
        "- Sprint: $($sprintInfo.Sprint) - $($sprintInfo.Theme)",
        "- Title: $title",
        "- Feature: $feature",
        "- Goal: $whatItDoes",
        "",
        "## Primary Specs",
        ""
    )

    foreach ($spec in $specs) {
        $docLines += "- $spec"
    }

    $docLines += @(
        "",
        "## Dependencies",
        ""
    )

    foreach ($dependency in $dependencies) {
        $docLines += "- $dependency"
    }

    $docLines += @(
        "",
        "## Workstreams",
        ""
    )

    foreach ($stream in $workstreams) {
        $docLines += "- $stream"
    }

    $docLines += @(
        "",
        "## Implementation Steps",
        ""
    )

    foreach ($step in $steps) {
        $docLines += "- $step"
    }

    $docLines += @(
        "",
        "## Deliverables",
        ""
    )

    foreach ($deliverable in $deliverables) {
        $docLines += "- $deliverable"
    }

    $docLines += @(
        "",
        "## Suggested Verification",
        ""
    )

    foreach ($test in $tests) {
        $docLines += "- $test"
    }

    $docLines += @(
        "",
        "## Notes",
        "",
        "- Keep the implementation scoped to this ticket and the specs it references.",
        "- Do not pull backlog features into this ticket unless a dependency explicitly requires shared scaffolding.",
        "- Preserve workspace-based tenant isolation on all business data and APIs affected by this work."
    )

    $fileName = ("ticket-{0:D3}-implementation.md" -f $ticketNumber)
    $filePath = Join-Path $outputRoot $fileName
    Set-Content -Path $filePath -Value $docLines -Encoding UTF8

    $indexLines += "- [$ticketId - $title](./$fileName)"
}

$indexPath = Join-Path $outputRoot "README.md"
Set-Content -Path $indexPath -Value $indexLines -Encoding UTF8

Write-Output "Generated $($ticketMatches.Count) ticket implementation guide files in $outputRoot"

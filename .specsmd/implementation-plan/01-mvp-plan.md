# MVP Plan

## Phase 1: Foundation

1. Setup frontend with Yarn, React, TypeScript, Vite.
2. Setup backend with FastAPI.
3. Setup PostgreSQL.
4. Setup SQLAlchemy models.
5. Setup Alembic migrations.
6. Implement authentication.
7. Create personal workspace on registration.
8. Implement workspace membership.

## Phase 2: Workspace and Projects

1. Create/list/switch workspaces.
2. Create organization workspace.
3. Invite organization members with plan member limit check.
4. Create/list/update/archive projects.

## Phase 3: Manual Draw.io

1. Add Draw.io editor frontend page.
2. Save manual Draw.io XML.
3. Store diagrams and diagram_versions.
4. Load and edit existing diagrams.
5. Add diagram version history.

## Phase 4: Subscription Foundation

1. Create plans table.
2. Create subscriptions table.
3. Create usage counters.
4. Implement feature permission checks.
5. Enforce SRS generation paid access.
6. Enforce organization max member count.

## Phase 5: AI SRS Generation

1. Create requirement_inputs.
2. Create generation_jobs.
3. Implement Summary Component.
4. Implement Requirement Extraction Component.
5. Implement Requirement Classification Component.
6. Implement SRS Builder.
7. Store srs_documents.
8. Store extracted_requirements.

## Phase 6: Class Diagram Generation

1. Implement diagram generator base interface.
2. Implement diagram generator registry.
3. Implement LLM class diagram generator.
4. Implement rule-based class diagram generator.
5. Implement Draw.io XML builder.
6. Save generated diagrams.
7. Open generated diagrams in Draw.io editor.

## Phase 7: Cleanup and Tests

1. Unit tests for services.
2. Unit tests for tenant isolation.
3. Unit tests for subscription checks.
4. Integration tests for SRS generation.
5. Integration tests for diagram save/load.

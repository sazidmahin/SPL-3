# Backend Folder Structure

Current backend layout:

```text
backend/
|-- requirements.txt
|-- alembic.ini
|-- .env.example
|-- README.md
|-- alembic/
|   |-- env.py
|   `-- versions/
|       |-- 20260621_0001_create_users_table.py
|       |-- 20260621_0002_create_workspaces_tables.py
|       |-- 20260627_0003_create_projects_table.py
|       |-- 20260627_0004_create_diagrams_tables.py
|       |-- 20260627_0005_create_billing_tables.py
|       |-- 20260628_0006_create_generation_tables.py
|       |-- 20260628_0007_create_llm_tables.py
|       |-- 20260628_0008_create_srs_result_tables.py
|       |-- 20260628_0009_create_diagram_requirement_links.py
|       `-- 20260628_0010_add_platform_admin_models.py
|-- app/
|   |-- main.py
|   |-- api/
|   |   |-- deps.py
|   |   `-- v1/
|   |       |-- router.py
|   |       `-- routes/
|   |           |-- admin.py
|   |           |-- auth.py
|   |           |-- billing.py
|   |           |-- diagrams.py
|   |           |-- health.py
|   |           |-- projects.py
|   |           |-- srs.py
|   |           `-- workspaces.py
|   |-- core/
|   |   |-- config.py
|   |   `-- security.py
|   |-- db/
|   |   |-- base.py
|   |   |-- session.py
|   |   `-- models/
|   |       |-- admin.py
|   |       |-- billing.py
|   |       |-- diagram.py
|   |       |-- generation.py
|   |       |-- llm.py
|   |       |-- project.py
|   |       |-- srs.py
|   |       |-- user.py
|   |       |-- workspace.py
|   |       `-- workspace_member.py
|   |-- schemas/
|   |   |-- admin.py
|   |   |-- auth.py
|   |   |-- billing.py
|   |   |-- diagram.py
|   |   |-- project.py
|   |   |-- srs.py
|   |   |-- user.py
|   |   `-- workspace.py
|   |-- scripts/
|   |   `-- seed_super_admin.py
|   `-- services/
|       |-- admin_service.py
|       |-- auth_service.py
|       |-- billing_service.py
|       |-- diagram_generation_service.py
|       |-- diagram_service.py
|       |-- llm_service.py
|       |-- project_service.py
|       |-- srs_service.py
|       `-- workspace_service.py
`-- tests/
    |-- integration/
    |   |-- test_admin_api.py
    |   |-- test_auth_api.py
    |   |-- test_billing_api.py
    |   |-- test_diagram_api.py
    |   |-- test_full_generation_flow.py
    |   |-- test_project_api.py
    |   |-- test_srs_generation_api.py
    |   `-- test_workspace_api.py
    `-- unit/
        |-- test_diagram_generation_service.py
        |-- test_llm_service.py
        |-- test_srs_pipeline_service.py
        `-- test_user_model.py
```

## Layering Notes

- `api/deps.py` owns request dependencies for authentication, workspace membership, workspace roles, and super-admin access.
- `api/v1/routes/*` converts HTTP requests into service calls and response schemas.
- `services/*` owns business rules and persistence orchestration.
- `db/models/*` owns SQLAlchemy table mappings.
- `schemas/*` owns Pydantic request/response contracts.
- `scripts/seed_super_admin.py` is an explicit operational bootstrap, not app startup behavior.

## Boundary Rules

- Normal product routes must stay workspace-scoped.
- Platform routes must stay under `/api/v1/admin`.
- Full admin access currently requires `users.platform_role = super_admin`.
- Admin reads and settings changes should be recorded in `admin_audit_logs`.

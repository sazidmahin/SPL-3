# SPL-3

Software Project Lab 3, IIT, University of Dhaka.

SPL-3 is a multi-tenant SRS and class-diagram generation platform. The current implementation is split into:

- `backend/`: FastAPI, SQLAlchemy, Alembic, auth, workspace billing, SRS generation, diagram generation, exports, and platform-admin APIs.
- `frontend/`: React/Vite client organized by domain, feature, and shared UI modules.
- `.specsmd/`: product, API, database, architecture, and implementation-ticket context for AI-DLC agents.

## Current Architecture Notes

Normal product APIs remain workspace-scoped through `workspace_id` and workspace membership checks. Platform administration is intentionally separate under `/api/v1/admin` and requires `users.platform_role = super_admin`.

SRS generation can optionally generate class-diagram artifacts in the same flow. Generated SRS content and generated diagrams include metadata for auditability, and diagram requirement links preserve traceability between extracted requirements and generated diagram elements.

## Backend Verification

From `backend/`:

```powershell
python -m pytest -q -p no:cacheprovider tests
```

## Frontend Verification

From `frontend/`:

```powershell
npm run lint
npm run build
```

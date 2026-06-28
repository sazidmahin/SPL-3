# Backend

FastAPI backend for the SRS Diagram Platform.

## Local Run

```powershell
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API health check is available at:

```text
GET /api/v1/health
```

## Environment

Copy `.env.example` and set the values for your environment.

```text
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/srs_diagram_platform
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=change-this-password
SUPER_ADMIN_FULL_NAME=Platform Super Admin
```

`SUPER_ADMIN_*` values are used only by the explicit bootstrap script. Public registration always creates normal platform users.

## Migrations

```powershell
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

Alembic reads `DATABASE_URL` through `app.core.config.Settings`; without an environment override it uses the local PostgreSQL URL shown in `.env.example`.

## Super Admin Bootstrap

After migrations have been applied, create the first platform admin from environment variables:

```powershell
python -m app.scripts.seed_super_admin
```

The bootstrap creates or promotes the configured email only when no existing `super_admin` user exists.

## API Boundaries

Workspace APIs must continue to enforce workspace membership and `workspace_id` query scoping. Platform-level visibility APIs live under `/api/v1/admin` and are guarded by `platform_role = super_admin`.

Admin read actions and platform-setting changes are recorded in `admin_audit_logs`.

## Tests

```powershell
python -m pytest -q -p no:cacheprovider tests
```

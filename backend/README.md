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

## Migrations

```powershell
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

Alembic reads `DATABASE_URL` through `app.core.config.Settings`; without an environment override it uses the local PostgreSQL URL shown in `.env.example`.

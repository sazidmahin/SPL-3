# SPL-3

Software Project Lab 3, IIT, University of Dhaka.

**SpecTwin** is a free, multi-tenant platform that turns a plain-language description of a system into a
reviewed Software Requirements Specification and a UML class diagram. The implementation is split into:

- `backend/`: FastAPI, SQLAlchemy, Alembic — auth, workspaces and members, the six-stage generation pipeline,
  SRS documents, diagrams, workspace search and platform-admin APIs.
- `frontend/`: React/Vite client — `src/api` (typed API client), `src/app` (shell, router, session),
  `src/pages` (one file per screen), `src/features` (stage editors, class modeler, draw.io) and `src/shared/ui`.
- `.specsmd/`: product, API, database, architecture, and implementation-ticket context for AI-DLC agents.

## Current Architecture Notes

Normal product APIs remain workspace-scoped through `workspace_id` and workspace membership checks. Platform administration is intentionally separate under `/api/v1/admin` and requires `users.platform_role = super_admin`.

SRS generation is a reviewed pipeline: input → clarifications → final story → requirements → class model →
draw.io diagram. Accepting the last stage publishes an IEEE-style SRS document (markdown, with a traceability
matrix) and saves the class diagram to the project; reopening and re-accepting a stage refreshes the same document.

Everything is free. The platform ships no AI key: the Rule-Based engine and local Ollama need none, and users who
want a hosted model (OpenAI, Anthropic, Gemini) add their own key under Settings → AI providers.

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

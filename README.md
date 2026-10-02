# SPL-3

Software Project Lab 3, IIT, University of Dhaka.

**SpecTwin** is a free, multi-tenant platform that turns a plain-language description of a system into a
reviewed Software Requirements Specification and a UML class diagram. The implementation is split into:

- `backend/`: FastAPI, SQLAlchemy, Alembic — auth, workspaces and members, the six-stage generation pipeline,
  SRS documents, diagrams, workspace search and platform-admin APIs.
- `frontend/`: React/Vite client — `src/api` (typed API client), `src/app` (shell, router, session),
  `src/pages` (one file per screen), `src/features` (stage editors, class modeler, draw.io) and `src/shared/ui`.
  A saved diagram opens in whichever view the reader wants — the interactive React canvas, the draw.io editor, or
  both side by side. The canvas reads its model straight out of the stored draw.io XML
  (`src/features/diagram/drawioModel.ts`), so every view shows the same drawing, including unsaved edits and older
  versions being previewed; editing stays in draw.io.
- `.specsmd/`: product, API, database, architecture, and implementation-ticket context for AI-DLC agents.

## Current Architecture Notes

Normal product APIs remain workspace-scoped through `workspace_id` and workspace membership checks. Platform administration is intentionally separate under `/api/v1/admin` and requires `users.platform_role = super_admin`.

SRS generation is a reviewed pipeline: input → clarifications → final story → requirements → class model →
draw.io diagram. Accepting the last stage publishes an IEEE-style SRS document (markdown, with a traceability
matrix) and saves the class diagram to the project; reopening and re-accepting a stage refreshes the same document.
The published document's Domain Model section carries what the Class Modeler's Classes tab shows: each class with
its attributes, operations and what it inherits or implements, every relationship written out in plain words, and
the enumerations.

A class model has one representation and three editors. The Classes tab edits it as structured fields, the draw.io
tab edits it as a diagram, and the interactive canvas draws it; a change in either editor is read back into the
model (`frontend/src/features/diagram/drawioModel.ts` and `drawioXml.ts` convert both ways), so all three stay in
step rather than drifting apart.

When correction memory is on (`RAG_ENABLED`), a fix the user makes to anything an AI engine produced — a pipeline
stage or a class model — is stored with an embedding of the input it came from, and the most similar past fixes are
fed back into the prompt next time. It applies to every model-authored engine, not just the local one, and falls
back to a built-in lexical embedder when no Ollama is installed to embed with.

Everything is free. Four engines write the pipeline, and none of them bills the user:

- **Rule-Based** — deterministic NLP rules, offline and explainable.
- **Local AI (Ollama)** — an open model on the user's own machine, no key.
- **AI generation** — a hosted model on one platform-managed key
  (`OPENROUTER_API_KEY`, see `backend/app/services/hosted_ai_service.py`). The engine is hidden when the key is unset,
  and the upstream vendor and its model ids stay out of the API and the UI, which only ever say "AI generation".
- **Your AI provider** — OpenAI, Anthropic or Gemini on the user's own key, added under Settings → AI providers and
  encrypted at rest.

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

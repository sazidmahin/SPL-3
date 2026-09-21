# Running SPL-3 in Docker

`docker compose` brings up the whole stack: Postgres, an **Ollama** server for local
AI, the FastAPI backend (migrations run automatically), and the built frontend.

## Prerequisites

- Docker Engine + Compose v2 (`docker compose version`).
- ~6 GB free disk for the Ollama model + images. First `ollama pull` downloads the model.
- (Optional) NVIDIA GPU: install `nvidia-container-toolkit` and uncomment the `deploy`
  block under the `ollama` service in `docker-compose.yml`. Without it Ollama runs on CPU.

## Start

```bash
cp .env.docker.example .env      # edit secrets / OLLAMA_MODEL if you like
docker compose up -d --build
```

| Service  | URL                                     |
| -------- | --------------------------------------- |
| Frontend | http://localhost:5173                   |
| Backend  | http://localhost:8000  (docs:`/docs`) |
| Ollama   | http://localhost:11434 (`/api/tags`)  |
| Postgres | localhost:5432                          |

`ollama-init` only pulls the single default `OLLAMA_MODEL` (default `llama3.2`) into the
`ollama-models` named volume, then exits — that's expected. Watch it with
`docker compose logs -f ollama-init`.

Models are cached in the `ollama-models` volume, which survives `docker compose down`
and any rebuild of `backend`/`frontend` (only `docker compose down -v` deletes it).
`ollama-init` checks `ollama list` first and skips the pull entirely (no network call)
if the model is already cached, so it never re-downloads on later starts. It also never
fails the stack: a pull error is only logged, not fatal, so `backend`/`frontend` still
start and the already-running `ollama` service is left alone. This means running
`docker compose up -d --build backend` (or `frontend`) will not rebuild, restart, or
disturb `ollama` at all — compose only touches the services you name plus whatever
still needs to reach a healthy/completed state.

The backend container runs `alembic upgrade head` on every start, and seeds a super
admin when `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD` are set.

## Using the local model

In the app, open **Generate SRS** and pick **Local AI (Ollama)** as the engine — no API
key needed. It calls the `ollama` service at `http://ollama:11434` using `OLLAMA_MODEL`.

Only `OLLAMA_MODEL` is auto-pulled. To use another model (e.g. `qwen2.5`), pull it
once into the running `ollama` service — it lands in the same cached volume and
survives restarts/rebuilds:

```bash
docker compose exec ollama ollama pull qwen2.5
docker compose exec ollama ollama list
```

Add the model name to `OLLAMA_MODELS` in `.env` so it shows up as a selectable model
in the app, then `docker compose up -d backend` (this only recreates the `backend`
container to pick up the new env var — it does not touch `ollama`).

## Common commands

```bash
docker compose logs -f backend
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed_super_admin
docker compose down            # keep data
docker compose down -v         # also drop the Postgres + Ollama volumes
```

## Notes

- The `srsgen` engine (local Qwen + QLoRA) needs the heavy GPU runtime in
  `requirements-srsgen-runtime.txt` and the `model_artifacts/` weights — it is **not**
  installed in the backend image. Use **Ollama** for local inference in Docker.
- All backend configuration comes from the compose `environment:` block; the container
  does not read `backend/.env`.

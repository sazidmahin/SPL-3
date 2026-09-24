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

## Local models on a CPU-only laptop

By default the backend talks to the Ollama installed on your machine
(`OLLAMA_BASE_URL=http://host.docker.internal:11434`), so inference runs natively on your
CPU/GPU, not inside Docker. The Ollama pipeline is built to stay usable without a GPU:

- **Fixed context window** (`OLLAMA_NUM_CTX=8192`). Ollama reloads the model whenever
  `num_ctx` changes, so every call uses the same window.
- **The model stays loaded** (`OLLAMA_KEEP_ALIVE=30m`), and creating an Ollama run loads it in
  the background while you review the input.
- **Compact prompts.** Each stage sends only what it needs, for example the story sentences for
  requirements and the requirement statements for classes. It never sends the whole previous stage.
- **Long input is chunked** (`OLLAMA_CHUNK_TOKENS=2000`). Chunk answers are merged and deduplicated.
  Nothing is cut off silently. Ollama drops the *start* of an over-long prompt, which is where the
  instructions are.
- **Bounded, schema-constrained answers.** Each task has its own output budget, and Ollama is given
  a JSON schema, so the answer is valid JSON of the right shape.
  - If the answer is still not JSON, it is repaired.
  - If it cannot be repaired, the model is asked once to reformat its own answer.
  - Failing that, the stage falls back to extracting lines from the text.
  - An answer cut off at the output limit has its chunk split in half and retried.
- **One call for all clarification answers**, instead of one call per question.

Tuning:

| Variable              | Default | When to change                                                       |
| --------------------- | ------- | -------------------------------------------------------------------- |
| `OLLAMA_MODEL`        | `llama3.2:1b` | `qwen2.5:1.5b` / `qwen2.5:3b` follow JSON better; 3B needs ~4 GB RAM |
| `OLLAMA_NUM_CTX`      | `8192`  | Lower to `4096` on 8 GB RAM machines (chunks get smaller)           |
| `OLLAMA_CHUNK_TOKENS` | `2000`  | Lower for faster, smaller calls; higher for fewer calls              |
| `OLLAMA_NUM_THREAD`   | empty   | Set to your physical core count if Ollama picks badly                |
| `OLLAMA_KEEP_ALIVE`   | `30m`   | How long the model stays in memory between stages                    |

Check what is loaded, and whether it runs on CPU or GPU, with `ollama ps`.

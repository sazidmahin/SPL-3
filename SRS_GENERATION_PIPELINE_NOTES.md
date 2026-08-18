# SRS Generation Pipeline Notes

Date: 2026-08-17

## Project Area

This note is about the SRS generation pipeline in this project. It does not cover login, logout, authentication screens, billing, or general workspace setup except where those are needed to access the pipeline.

The pipeline takes a user's rough software requirement and moves it through structured stages so the system can generate project documentation and related artifacts.

## What The Pipeline Does

The user gives a business/software requirement in natural language. The input may be rough, incomplete, or written like a real client would describe the software.

Example input:

```text
I need a system for managing a small software company. There should be projects, tasks, team members, client access, file upload, status tracking, notifications, reports, and maybe invoice or billing related things. Admin should control users and permissions. Clients should see only their own projects. Need dashboard also.
```

The pipeline should process this input and produce a more structured software specification.

## Expected Pipeline Flow

1. Requirement input

   The user enters the raw business requirement for the whole software or for a feature.

2. Clarification questions

   The system detects missing or unclear details and asks questions. The user answers those questions from the frontend.

3. Clarification approval

   After all required clarification questions are answered or skipped, the user approves the clarification stage.

4. SRS generation

   The system generates a Software Requirements Specification based on the original input and approved clarification answers.

5. Artifact generation

   The system may generate related artifacts such as diagrams, modules, user stories, API ideas, database models, or test cases depending on the configured pipeline stages.

6. Review and save

   The generated result is shown to the user for review, then saved against the selected workspace and project.

## Current Work

The current work is focused on testing and debugging the SRS generation pipeline, especially the clarification approval stage.

The main issue being investigated:

```text
POST /generation-pipelines/{run_id}/stages/clarifications/approve
returns 409 Conflict
```

This happens after the user answers clarification questions in the frontend.

## Known Backend Validation Points

The backend can reject clarification approval when one of these conditions is not satisfied:

1. The requested stage is not the current active pipeline stage.
2. The frontend sends an old or wrong `version_number`.
3. The clarification revision is not in an approvable state.
4. One or more open clarification questions are still not answered or skipped.
5. The saved clarification answers are not reaching the backend in the expected payload shape.

## Why Extra Logs Were Added

Logs were added so the issue can be debugged without always opening the browser Network tab.

The frontend now logs the request body when:

1. Saving a pipeline stage.
2. Approving a pipeline stage.
3. Approval fails.

The backend now logs useful rejection details when clarification approval fails.

The backend log includes:

```text
run_id
project_id
requested_version
actual_revision_version
actual_revision_status
open_question_ids
answered_question_ids
unanswered_question_ids
rejection_reason
```

The backend intentionally does not log actual answer text, API keys, or auth tokens.

## Files Changed For Debugging

Frontend:

```text
frontend/src/domains/generationPipeline/api.ts
```

Backend:

```text
backend/app/services/generation_pipeline_service.py
```

## How To Debug The 409 Conflict

1. Open the browser DevTools Console.
2. Answer all clarification questions in the frontend.
3. Check the frontend console log for `Saving pipeline stage request`.
4. Confirm that the request body contains all question answers.
5. Check the frontend console log for `Approving pipeline stage request`.
6. Confirm that `version_number` matches the latest saved clarification revision.
7. Check the backend terminal log if approval returns 409.
8. Compare backend `unanswered_question_ids` with frontend submitted answers.

## Expected Fix Direction

If the frontend is sending all answers but backend still reports unanswered question IDs, then the issue is likely one of these:

1. Answer object keys do not match backend question IDs.
2. Answers are stored in local UI state but not included in the save payload.
3. The frontend approves before the save request finishes.
4. The frontend approves an older revision version.
5. Backend expects a different payload structure for clarification answers.

The next concrete step is to reproduce the issue once, then compare:

```text
frontend requestBody.payload
backend answered_question_ids
backend unanswered_question_ids
approval version_number
```

## Database Migration Issue

Earlier errors showed missing PostgreSQL tables:

```text
user_ai_provider_credentials
generation_pipeline_runs
```

That means the application code expects tables that do not exist in the currently connected database.

The likely fix is to run backend migrations against the same database used by the running API:

```powershell
cd backend
.\.venv\Scripts\alembic.exe upgrade head
```

Before running migrations, confirm that the backend `DATABASE_URL` points to the intended local database.

## Short Summary

This project has an SRS generation pipeline where users submit rough requirements, answer clarification questions, approve the clarified requirement, and generate structured SRS-related artifacts. The current debugging work is focused on why clarification approval returns 409 even after the user answers all questions. Frontend and backend logs were added to expose the exact request body, revision version, answered question IDs, and unanswered question IDs.

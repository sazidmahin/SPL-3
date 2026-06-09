# ADR-002: Use FastAPI Backend

## Status

Accepted

## Context

The backend needs to expose APIs for authentication, workspaces, projects, SRS generation, diagrams, and billing.

## Decision

Use FastAPI for the backend.

## Consequences

The backend will use:

- FastAPI routing
- Pydantic schemas
- SQLAlchemy models
- Alembic migrations
- PostgreSQL database

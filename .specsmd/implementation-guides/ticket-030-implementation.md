# TICKET-030 Implementation

## Overview

- Ticket: TICKET-030
- Sprint: Sprint 5 - Manual Draw.io Diagram Editor
- Title: Diagram Model
- Feature: Diagram metadata
- Goal: Creates the `diagrams` table and model for storing diagram metadata such as title, type, source, status, and current version.

## Primary Specs

- .specsmd/features/04-manual-drawio-diagrams.md
- .specsmd/api/06-diagram-api.md
- .specsmd/architecture/05-drawio-integration.md
- .specsmd/frontend/04-drawio-editor-frontend.md

## Dependencies

- TICKET-021
- TICKET-019

## Workstreams

- Diagram persistence
- Workspace-scoped API
- Versioned XML storage

## Implementation Steps

- Define or extend the diagram persistence model so Draw.io XML and diagram metadata live in workspace-scoped tables.
- Implement the FastAPI endpoint behavior for create, load, list, save-version, or version-history use cases from the diagram API spec.
- Keep version increments, current_version updates, and project ownership checks inside one service boundary.
- Add tests for XML persistence, version ordering, and cross-workspace access rejection.

## Deliverables

- Diagram data model changes
- Diagram/version endpoints
- Persistence tests

## Suggested Verification

- Workspace-scoped API tests
- Validation errors
- Not-found and forbidden cases

## Notes

- Keep the implementation scoped to this ticket and the specs it references.
- Do not pull backlog features into this ticket unless a dependency explicitly requires shared scaffolding.
- Preserve workspace-based tenant isolation on all business data and APIs affected by this work.

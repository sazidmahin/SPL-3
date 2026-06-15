# TICKET-022 Implementation

## Overview

- Ticket: TICKET-022
- Sprint: Sprint 4 - Projects
- Title: Create Project API
- Feature: Create project
- Goal: Allows workspace members to create a project inside the selected workspace.

## Primary Specs

- .specsmd/features/03-projects.md
- .specsmd/api/04-project-api.md
- .specsmd/architecture/03-multi-tenant-workspace-design.md
- .specsmd/frontend/03-frontend-pages.md

## Dependencies

- TICKET-021
- TICKET-017

## Workstreams

- Project domain model
- Workspace-scoped API
- Soft-delete and validation

## Implementation Steps

- Add the project domain model or API changes in the backend while keeping all reads and writes scoped by workspace_id.
- Introduce request/response schemas that match the project API spec and support creation, update, listing, detail, or archive flow.
- Use service or repository boundaries to centralize business rules such as active-status filtering and mutation permissions.
- Cover the route with tests for valid workspace access, missing project, and forbidden access.

## Deliverables

- Project model/service/repository changes
- Workspace-scoped project endpoints
- Backend tests

## Suggested Verification

- Workspace-scoped API tests
- Validation errors
- Not-found and forbidden cases

## Notes

- Keep the implementation scoped to this ticket and the specs it references.
- Do not pull backlog features into this ticket unless a dependency explicitly requires shared scaffolding.
- Preserve workspace-based tenant isolation on all business data and APIs affected by this work.

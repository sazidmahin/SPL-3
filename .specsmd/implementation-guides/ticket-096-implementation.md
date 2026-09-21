# TICKET-096 Implementation

## Overview

- Ticket: TICKET-096
- Sprint: Sprint 13 - Extended Scope - Super Admin
- Title: Platform Role Fields
- Feature: Platform-level admin identity
- Goal: Extends the `users` table and backend model with `platform_role` and `is_platform_admin` so platform access remains separate from workspace roles.

## Primary Specs

- .specsmd/Extended-Scopes/01-extended-scope-super-admin.md
- .specsmd/database/01-database-design.md
- .specsmd/database/05-super-admin.md
- .specsmd/api/01-api-overview.md
- .specsmd/architecture/03-multi-tenant-workspace-design.md

## Dependencies

- TICKET-006

## Workstreams

- Platform admin model
- Admin authorization
- Auditability

## Implementation Steps

- Implement the platform-admin model, seed flow, dependency, or API described by this ticket while keeping it separate from workspace membership roles.
- Use dedicated /api/v1/admin behavior for privileged access and preserve workspace_id scoping on normal application routes.
- Log sensitive admin actions or configuration changes where the extended-scope spec requires auditability.
- Add focused tests for allowed admin access, denied non-admin access, and the expected platform-side side effects.

## Deliverables

- Platform admin data model or API
- Admin-only authorization flow
- Audit or bootstrap coverage

## Suggested Verification

- Admin authorization tests
- Seed/bootstrap verification
- Audit-log or settings persistence checks

## Notes

- Keep the implementation scoped to this ticket and the specs it references.
- Do not pull backlog features into this ticket unless a dependency explicitly requires shared scaffolding.
- Preserve workspace-based tenant isolation on all business data and APIs affected by this work.

# TICKET-020 Implementation

## Overview

- Ticket: TICKET-020
- Sprint: Sprint 3 - Workspace and Tenant Isolation
- Title: Workspace Switcher UI
- Feature: Frontend workspace selector
- Goal: Allows users to switch between their personal workspace and organization workspaces in the frontend, and provides the base workspace settings and dashboard context UI for the selected workspace.

## Primary Specs

- .specsmd/features/02-workspaces.md
- .specsmd/api/03-workspace-api.md
- .specsmd/architecture/03-multi-tenant-workspace-design.md
- .specsmd/database/03-tenant-isolation-rules.md
- .specsmd/frontend/03-frontend-pages.md

## Dependencies

- TICKET-015
- TICKET-016
- TICKET-017

## Workstreams

- Frontend workspace UX
- State management
- Permission-aware navigation

## Implementation Steps

- Build workspace-selection UI that shows personal and organization workspaces using the authenticated user's workspace list.
- Store the active workspace in shared client state and propagate it to project, billing, SRS, and diagram routes.
- Guard actions and labels based on membership role so the UI matches backend permissions.
- Verify switching between workspaces refreshes all workspace-scoped data correctly.

## Deliverables

- Workspace switcher page or component
- Shared workspace state
- Frontend interaction checks

## Suggested Verification

- Component rendering test
- Active workspace switch flow
- Permission-state check

## Notes

- Keep the implementation scoped to this ticket and the specs it references.
- Do not pull backlog features into this ticket unless a dependency explicitly requires shared scaffolding.
- Preserve workspace-based tenant isolation on all business data and APIs affected by this work.

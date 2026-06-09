# ADR-001: Use Workspace as Tenant Boundary

## Status

Accepted

## Context

The system must support:

- users who are not part of any organization
- personal subscriptions
- organization subscriptions
- organization-level data isolation
- organization member limits

Using only org_id would not cleanly support individual users.

## Decision

Use workspace_id as the tenant isolation key.

A workspace can be:

- personal
- organization

All business tables must include workspace_id.

## Consequences

This supports:

- individual users
- organization users
- personal subscriptions
- organization subscriptions
- workspace-scoped projects
- safe tenant isolation

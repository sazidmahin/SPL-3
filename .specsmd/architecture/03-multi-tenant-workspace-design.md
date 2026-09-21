# Multi-Tenant Workspace Design

The system uses `workspace_id` as the tenant isolation key for normal product data.

A workspace can be:

1. personal
2. organization

Every registered user receives a personal workspace. A user can belong to multiple workspaces, and workspace membership determines access inside each workspace.

## Workspace-Owned Tables

These tables must include and enforce `workspace_id` scoping on normal APIs:

- projects
- requirement_inputs
- generation_jobs
- srs_documents
- extracted_requirements
- diagrams
- diagram_versions
- diagram_requirement_links
- subscriptions
- usage_counters
- llm_calls
- payment_customers
- invoices

Correct query pattern:

```sql
SELECT *
FROM projects
WHERE id = :project_id
AND workspace_id = :workspace_id;
```

## Normal API Access Flow

1. JWT authentication
2. Load current active user
3. Read `workspace_id` from the route
4. Check active `workspace_members` record
5. Check workspace role permission
6. Check subscription and plan feature when the endpoint is paid
7. Run workspace-scoped queries

## Platform Admin Access Flow

Platform administration is a separate role layer from workspace membership.

`users.platform_role` values:

- `user`
- `support_admin` reserved for later limited support workflows
- `super_admin`

Only `super_admin` can access the current `/api/v1/admin` APIs. Normal workspace APIs must not silently bypass workspace membership for platform admins.

Admin access flow:

1. JWT authentication
2. Load current active user
3. Require `user.platform_role = super_admin`
4. Use dedicated `/api/v1/admin` routes for platform visibility or configuration
5. Log sensitive admin actions in `admin_audit_logs`

# API Overview

Base path:

```text
/api/v1
```

Workspace-scoped APIs should include `workspace_id` in path.

Recommended pattern:

```text
/api/v1/workspaces/{workspace_id}/projects
/api/v1/workspaces/{workspace_id}/projects/{project_id}/srs/generate
/api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams
/api/v1/workspaces/{workspace_id}/projects/{project_id}/generation-jobs/{job_id}
```

All workspace-scoped endpoints must verify:

- current user is authenticated
- user is active member of workspace
- user has required role
- workspace subscription allows paid feature if needed
- business queries are scoped by `workspace_id`

## Admin APIs

Platform admin APIs are separate from workspace APIs.

Admin base path:

```text
/api/v1/admin
```

Only users with `platform_role = super_admin` can access full admin routes. The `support_admin` platform role is reserved for later limited-access support workflows and should not receive the full `/api/v1/admin` surface by default.

Initial admin routes:

```text
GET /api/v1/admin/users
GET /api/v1/admin/workspaces
GET /api/v1/admin/subscriptions
GET /api/v1/admin/projects
GET /api/v1/admin/generation-jobs
GET /api/v1/admin/llm-calls
GET /api/v1/admin/audit-logs
GET /api/v1/admin/platform-settings
PUT /api/v1/admin/platform-settings/{key}
```

Admin reads and settings changes should create `admin_audit_logs` entries, except audit-log reads may remain read-only to avoid recursive noise.

# Backend API Demo Requests

Base URL:

```text
http://localhost:8000/api/v1
```

For protected APIs, send:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Use real UUID values in path placeholders such as `{workspace_id}`, `{project_id}`,
`{srs_document_id}`, `{diagram_id}`, and `{job_id}`.

## Health

### GET `/health`

No request body.

## Auth

### POST `/auth/register`

```json
{
  "email": "demo@example.com",
  "password": "password123",
  "full_name": "Demo User"
}
```

### POST `/auth/login`

```json
{
  "email": "demo@example.com",
  "password": "password123"
}
```

### GET `/auth/me`

No request body.

## Workspaces

### GET `/workspaces`

No request body.

### POST `/workspaces`

```json
{
  "name": "Demo Organization",
  "slug": "demo-organization",
  "type": "organization"
}
```

### GET `/workspaces/{workspace_id}`

No request body.

### GET `/workspaces/{workspace_id}/members`

No request body.

### POST `/workspaces/{workspace_id}/members/invite`

Allowed roles: `admin`, `member`, `viewer`.

```json
{
  "email": "member@example.com",
  "role": "member"
}
```

## Projects

### GET `/workspaces/{workspace_id}/projects`

No request body.

### POST `/workspaces/{workspace_id}/projects`

```json
{
  "name": "Inventory Management System",
  "description": "SRS and diagrams for inventory workflows"
}
```

### GET `/workspaces/{workspace_id}/projects/{project_id}`

No request body.

### PATCH `/workspaces/{workspace_id}/projects/{project_id}`

Allowed status values: `active`, `archived`.

```json
{
  "name": "Updated Inventory System",
  "description": "Updated project description",
  "status": "active"
}
```

### POST `/workspaces/{workspace_id}/projects/{project_id}/archive`

No request body.

## Billing

### GET `/billing/plans`

No request body.

### GET `/workspaces/{workspace_id}/billing/subscription`

No request body.

### GET `/workspaces/{workspace_id}/billing/usage`

No request body.

### POST `/workspaces/{workspace_id}/billing/checkout`

```json
{
  "plan_code": "pro"
}
```

## SRS

### POST `/workspaces/{workspace_id}/projects/{project_id}/srs/inputs`

```json
{
  "title": "Library Management System Requirements",
  "raw_text": "The system shall allow members to search books. Librarians can add, update, and remove books. Members can borrow and return books."
}
```

### POST `/workspaces/{workspace_id}/projects/{project_id}/srs/generate`

Allowed `diagram_methods` values: `llm`, `rule_based`.

```json
{
  "title": "Library Management System Requirements",
  "raw_text": "The system shall allow members to search books. Librarians can add, update, and remove books. Members can borrow and return books.",
  "generate_class_diagram": true,
  "diagram_methods": ["rule_based"]
}
```

### GET `/workspaces/{workspace_id}/projects/{project_id}/srs/jobs`

No request body.

### GET `/workspaces/{workspace_id}/projects/{project_id}/srs/jobs/{job_id}`

No request body.

### GET `/workspaces/{workspace_id}/projects/{project_id}/srs`

No request body.

### GET `/workspaces/{workspace_id}/projects/{project_id}/srs/{srs_document_id}`

No request body.

### GET `/workspaces/{workspace_id}/projects/{project_id}/srs/{srs_document_id}/export`

No request body.

## Diagrams

### GET `/workspaces/{workspace_id}/projects/{project_id}/diagrams`

No request body.

### POST `/workspaces/{workspace_id}/projects/{project_id}/diagrams`

```json
{
  "title": "Manual Class Diagram",
  "diagram_type": "drawio",
  "drawio_xml": "<mxfile><diagram name=\"Page-1\"></diagram></mxfile>",
  "diagram_json": null
}
```

### POST `/workspaces/{workspace_id}/projects/{project_id}/diagrams/class/generate`

Allowed methods: `llm`, `rule_based`, `both`.

```json
{
  "requirement_input_id": "00000000-0000-0000-0000-000000000000",
  "srs_document_id": null,
  "methods": ["rule_based"]
}
```

### GET `/workspaces/{workspace_id}/projects/{project_id}/diagrams/{diagram_id}`

No request body.

### GET `/workspaces/{workspace_id}/projects/{project_id}/diagrams/{diagram_id}/export`

No request body.

### GET `/workspaces/{workspace_id}/projects/{project_id}/diagrams/{diagram_id}/versions`

No request body.

### POST `/workspaces/{workspace_id}/projects/{project_id}/diagrams/{diagram_id}/versions`

```json
{
  "drawio_xml": "<mxfile><diagram name=\"Page-1\"></diagram></mxfile>",
  "diagram_json": null
}
```

## Admin

Admin APIs require a super admin bearer token.

### GET `/admin/users`

No request body.

### GET `/admin/workspaces`

No request body.

### GET `/admin/subscriptions`

No request body.

### GET `/admin/projects`

No request body.

### GET `/admin/generation-jobs`

No request body.

### GET `/admin/llm-calls`

No request body.

### GET `/admin/audit-logs`

No request body.

### GET `/admin/platform-settings`

No request body.

### PUT `/admin/platform-settings/{key}`

Example endpoint: `/admin/platform-settings/maintenance_mode`

```json
{
  "value": false,
  "description": "Enable or disable platform maintenance mode"
}
```

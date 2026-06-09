
# Multi-Tenant Workspace Design

The system uses workspace_id as the tenant isolation key.

A workspace can be:

1. personal
2. organization

Every user receives a personal workspace after registration.

A user can belong to multiple workspaces.

Workspace membership determines access.

Business data must be owned by a workspace.

Tables that must include workspace_id:

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


Access flow:

## API request

## JWT authentication

## Get current user

## Get workspace_id

## Check workspace_members

## Check role permission

## Check subscription if paid feature

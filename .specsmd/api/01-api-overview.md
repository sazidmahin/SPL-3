# API Overview

Base path:

/api/v1

Workspace-scoped APIs should include workspace_id in path.

Recommended pattern:

/api/v1/workspaces/{workspace_id}/projects
/api/v1/workspaces/{workspace_id}/projects/{project_id}/srs/generate
/api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams
/api/v1/workspaces/{workspace_id}/projects/{project_id}/generation-jobs/{job_id}

All workspace-scoped endpoints must verify:

- current user is authenticated
- user is active member of workspace
- user has required role
- workspace subscription allows paid feature if needed

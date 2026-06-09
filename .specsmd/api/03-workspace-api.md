# Workspace API

## List Workspaces

GET /api/v1/workspaces

Returns workspaces where current user is active member.

## Create Organization Workspace

POST /api/v1/workspaces

Request:

- name
- slug
- type = organization

Behavior:

- create workspace
- add current user as owner

## Get Workspace

GET /api/v1/workspaces/{workspace_id}

Must verify membership.

## Invite Member

POST /api/v1/workspaces/{workspace_id}/members/invite

Rules:

- current user must be owner/admin
- workspace type must be organization
- active member count must be below plan.max_members

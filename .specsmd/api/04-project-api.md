# Project API

## Create Project

POST /api/v1/workspaces/{workspace_id}/projects

Request:

- name
- description

## List Projects

GET /api/v1/workspaces/{workspace_id}/projects

## Get Project

GET /api/v1/workspaces/{workspace_id}/projects/{project_id}

## Update Project

PATCH /api/v1/workspaces/{workspace_id}/projects/{project_id}

## Archive Project

POST /api/v1/workspaces/{workspace_id}/projects/{project_id}/archive

All project endpoints must scope by workspace_id.

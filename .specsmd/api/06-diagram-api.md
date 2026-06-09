# Diagram API

## Create Manual Diagram

POST /api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams

Request:

- title
- diagram_type
- drawio_xml

Behavior:

- create diagrams row
- create diagram_versions row with version 1

## Save Diagram Version

POST /api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams/{diagram_id}/versions

Request:

- drawio_xml
- diagram_json optional

Behavior:

- create next version
- update diagrams.current_version

## Generate Class Diagram

POST /api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams/class/generate

Request:

- requirement_input_id or srs_document_id
- methods: llm, rule_based, both

Behavior:

- check subscription if AI method used
- use extracted requirements
- generate Draw.io XML
- save diagram and versions

## Get Diagram

GET /api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams/{diagram_id}

## List Diagrams

GET /api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams

## List Diagram Versions

GET /api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams/{diagram_id}/versions

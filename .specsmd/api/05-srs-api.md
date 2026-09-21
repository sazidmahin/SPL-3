# SRS API

## Generate SRS

POST /api/v1/workspaces/{workspace_id}/projects/{project_id}/srs/generate

Request:

- title
- raw_text
- generate_class_diagram boolean
- diagram_methods array: llm, rule_based

Behavior:

- check membership
- check subscription
- check usage
- create requirement_input
- create generation_job
- run SRS pipeline
- store SRS document
- store extracted requirements
- optionally generate class diagrams

## Get SRS Document

GET /api/v1/workspaces/{workspace_id}/projects/{project_id}/srs/{srs_document_id}

## List SRS Documents

GET /api/v1/workspaces/{workspace_id}/projects/{project_id}/srs

All queries must scope by workspace_id and project_id.

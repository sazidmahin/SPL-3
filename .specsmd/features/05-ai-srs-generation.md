# AI SRS Generation

AI SRS generation is a paid workspace feature.

Before generation:

- authenticate the current user
- check active workspace membership
- check the caller has an allowed workspace role
- check active subscription
- check `plan.can_generate_srs`
- check monthly usage limit
- keep all reads and writes scoped by `workspace_id`

## Flow

1. User submits natural-language requirements to the workspace/project SRS generation endpoint.
2. FastAPI creates `requirement_inputs`.
3. FastAPI creates a `generation_jobs` row.
4. The SRS pipeline runs summary, requirement extraction, requirement classification, and SRS assembly.
5. The backend stores `srs_documents` and `extracted_requirements`.
6. If `generate_class_diagram = true`, the class-diagram generator creates diagram artifacts from the generated SRS requirements.
7. The response returns the requirement input, generation job, SRS document, and generated diagrams.

## Stored Output

`SrsDocument.content_json` should include:

- summary
- functional requirements
- non-functional requirements
- assumptions and constraints
- generation metadata, including job and LLM-call metadata when available

## Exports

SRS export is a paid feature controlled by `plan.can_export_srs`.

```text
GET /api/v1/workspaces/{workspace_id}/projects/{project_id}/srs/{srs_document_id}/export
```

## Generation Job Statuses

- pending
- running
- completed
- failed
- partially_completed

Use `partially_completed` when SRS generation succeeds but optional diagram generation fails.

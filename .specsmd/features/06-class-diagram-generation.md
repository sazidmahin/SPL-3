# Class Diagram Generation

Class diagram generation uses extracted SRS requirements and remains workspace-scoped.

The system supports:

- rule-based class diagram generation
- LLM-based class diagram generation as an extension point
- manual Draw.io XML editing and versioning when the workspace plan allows it

## Output

Generated and manually saved diagrams store:

- `diagrams` metadata
- `diagram_versions.current_xml`
- generated `diagram_json` when available
- `diagram_requirement_links` for traceability between extracted requirements and diagram elements

## Full Generation Flow

1. SRS generation stores extracted requirements.
2. Class diagram generation reads those extracted requirements.
3. The selected generator produces Draw.io XML and structured diagram JSON.
4. The backend stores a diagram and initial diagram version.
5. Traceability links are stored for generated requirement-to-element mappings.
6. The frontend presents generated artifacts for review and allows opening the generated diagram.

## Manual Diagram Flow

1. User creates or opens a diagram.
2. User edits Draw.io XML.
3. Save creates a new diagram version when allowed by the workspace plan and usage limit.
4. The latest version remains the current XML for export and review.

## Exports

Diagram export is a paid feature controlled by `plan.can_export_diagrams`.

```text
GET /api/v1/workspaces/{workspace_id}/projects/{project_id}/diagrams/{diagram_id}/export
```

Class diagram generation should remain extensible so other diagram types can be added later.

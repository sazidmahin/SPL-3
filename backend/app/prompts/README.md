# Prompt Catalog

Prompts are stored as versioned Markdown files with frontmatter.

Naming convention:

`<domain>.<task>.v<version>.md`

Example:

`srs.requirement_sufficiency.v1.md`

Frontmatter fields:

- `name`: database prompt template name
- `version`: integer version
- `purpose`: LLM call purpose

Rules:

- Never edit an existing version for behavioral changes; create `v2`.
- Keep stakeholder/user text inside explicit untrusted delimiters.
- Return JSON only when the service parser expects JSON.
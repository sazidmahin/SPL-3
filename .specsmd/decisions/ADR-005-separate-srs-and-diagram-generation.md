# ADR-005: Separate SRS and Diagram Generation

## Status

Accepted

## Context

The platform must support SRS generation and many diagram types.

If diagram generation is mixed directly into the SRS pipeline, future extension will be difficult.

## Decision

Keep SRS generation and diagram generation separate.

SRS pipeline produces:

- SRS document
- extracted requirements
- classified requirements
- shared requirement context

Diagram pipeline consumes extracted requirements and shared context.

## Consequences

The system can add future diagram generators without modifying core SRS generation.

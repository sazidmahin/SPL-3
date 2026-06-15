# TICKET-076 Implementation

## Overview

- Ticket: TICKET-076
- Sprint: Sprint 9 - Class Diagram Generation
- Title: Open Generated Diagram in Draw.io
- Feature: Edit generated class diagram
- Goal: Opens generated Draw.io XML inside the frontend Draw.io editor so users can manually edit and save it.

## Primary Specs

- .specsmd/features/06-class-diagram-generation.md
- .specsmd/backend/05-diagram-generator-services.md
- .specsmd/api/06-diagram-api.md
- .specsmd/architecture/05-drawio-integration.md

## Dependencies

- TICKET-037
- TICKET-074
- TICKET-075

## Workstreams

- Frontend editor handoff
- Generated diagram editing
- Diagram persistence integration

## Implementation Steps

- Add the generator abstraction, registry entry, diagram context builder, or XML builder required by this ticket.
- Ensure both LLM-based and rule-based paths can plug into the same normalized diagram-generation contract.
- Persist generated diagrams through the existing diagram/version model and keep workspace/project ownership checks intact.
- Add tests that exercise output normalization, XML generation, and generator selection logic.

## Deliverables

- Generator abstractions or implementations
- Draw.io XML output
- Diagram persistence integration

## Suggested Verification

- Generator unit tests
- XML output assertions
- Persistence integration tests

## Notes

- Keep the implementation scoped to this ticket and the specs it references.
- Do not pull backlog features into this ticket unless a dependency explicitly requires shared scaffolding.
- Preserve workspace-based tenant isolation on all business data and APIs affected by this work.

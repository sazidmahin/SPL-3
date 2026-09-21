# TICKET-070 Implementation

## Overview

- Ticket: TICKET-070
- Sprint: Sprint 9 - Class Diagram Generation
- Title: LLM Class Diagram Generator
- Feature: AI class diagram generation
- Goal: Uses extracted requirements and an LLM prompt to generate class diagram structure and Draw.io-compatible XML.

## Primary Specs

- .specsmd/features/06-class-diagram-generation.md
- .specsmd/backend/05-diagram-generator-services.md
- .specsmd/api/06-diagram-api.md
- .specsmd/architecture/05-drawio-integration.md

## Dependencies

- TICKET-058
- TICKET-067
- TICKET-068
- TICKET-069

## Workstreams

- Diagram generator architecture
- Generation services
- Draw.io XML output

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

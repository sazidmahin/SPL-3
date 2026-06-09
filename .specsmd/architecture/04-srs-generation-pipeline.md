
# SRS Generation Pipeline

The SRS generation pipeline is based on modular task decomposition.

The backend should not ask the LLM to generate the whole SRS in one uncontrolled call.

Pipeline:

Raw natural-language input
--------------------------

Summary Component
-----------------

Requirement Extraction Component
--------------------------------

Requirement Classification Component
------------------------------------

SRS Builder
-----------

Generated SRS document

## Summary Component

Generates summary-type SRS sections:

- Introduction
- Stakeholders / Users
- Use Cases
- Glossary

## Requirement Extraction Component

Extracts structured requirements from raw text.

Each extracted requirement should include:

- requirement_code
- requirement_text
- source_trace
- extraction_reason

Preferred requirement style:

The `<subject>` shall `<action>` `<object>` `<qualifier>`, when `<condition>`.

## Requirement Classification Component

Classifies requirements into:

- Functional Requirement
- Non-Functional Requirement

NFR subtypes:

- Availability
- Performance
- Security
- Usability
- Maintainability
- Portability
- Scalability
- Legal
- Look & Feel
- Fault Tolerance
- Operational

## SRS Builder

Builds the final SRS document using:

- Summary sections
- Functional requirements
- Non-functional requirements
- Glossary
- Traceability metadata

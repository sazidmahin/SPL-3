# SRS Pipeline Services

The backend SRS pipeline contains:

1. Summary Component
2. Requirement Extraction Component
3. Requirement Classification Component
4. SRS Builder

Each component must be independently testable.

Each component should use a versioned prompt template.

## Pipeline

Raw requirement input
---------------------

Summary Component
-----------------

Requirement Extraction Component
--------------------------------

Requirement Classification Component
------------------------------------

SRS Builder
-----------

SRS Document

## Summary Component

Input:

- raw_text

Output:

- introduction
- stakeholders
- use_cases
- glossary

## Requirement Extraction Component

Input:

- raw_text

Output:

- list of extracted requirements

Each item:

- requirement_code
- requirement_text
- source_trace
- extraction_reason
- confidence_score

## Requirement Classification Component

Input:

- extracted requirements

Output:

- classified requirements

Each item:

- requirement_type
- nfr_subtype if non-functional

## SRS Builder

Input:

- summary sections
- classified requirements

Output:

- content_markdown
- content_json

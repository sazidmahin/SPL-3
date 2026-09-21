# Project Context for Codex

## Product Name

SRS Diagram Platform

## Main Goal

Build a web-based platform where users can:

1. Register and log in.
2. Use a personal workspace if they are not part of an organization.
3. Join or create organization workspaces.
4. Create projects.
5. Manually draw diagrams using integrated Draw.io.
6. Save and version Draw.io diagrams.
7. Generate Software Requirements Specification documents using AI.
8. Generate class diagrams from requirements.
9. Open generated diagrams inside Draw.io for editing.
10. Export SRS and diagrams depending on subscription permissions.

## Technology Stack

Frontend:

- React
- TypeScript
- Vite
- Yarn

Backend:

- FastAPI
- Python
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic

Storage:

- PostgreSQL for relational data
- Draw.io XML stored in database as text

AI:

- LLM provider abstraction
- Prompt templates stored separately
- SRS generation follows modular pipeline:
  - Summary Component
  - Requirement Extraction Component
  - Requirement Classification Component
  - SRS Builder

Diagram generation:

- Manual Draw.io editor
- AI class diagram generator
- Rule-based class diagram generator
- Future support for use case, sequence, ER, activity, and state diagrams

## Important Business Rules

The system supports two workspace types:

1. Personal workspace

   - Created automatically when a user registers.
   - Used by individual users.
   - Can have individual subscription.
   - Max member count is 1.
2. Organization workspace

   - Created by a user.
   - Can have multiple members.
   - Uses organization subscription.
   - Subscription plan controls maximum number of members.

## Subscription Rules

Manual Draw.io diagram editing can be available for free or limited plans.

AI SRS generation requires a paid subscription.

AI diagram generation also requires a paid subscription unless later decided otherwise.

Before allowing AI SRS generation, backend must check:

- User belongs to the workspace.
- Workspace has active subscription.
- Plan allows SRS generation.
- Monthly SRS usage limit is not exceeded.

Before inviting user to organization workspace, backend must check:

- Current user is owner/admin.
- Workspace type is organization.
- Active member count is less than plan.max_members.

## Tenant Isolation

Use workspace_id as the tenant isolation key.

Every sensitive business table must include workspace_id.

Every query for business data must be scoped by workspace_id.

Wrong:

SELECT * FROM projects WHERE id = :project_id;

Correct:

SELECT * FROM projects
WHERE id = :project_id
AND workspace_id = :workspace_id;

## Draw.io Integration

Draw.io is not only a renderer.

It is the main diagram editor inside the site.

Manual flow:

User
----

Open Draw.io editor
-------------------

Draw diagram manually
---------------------

Save XML
--------

Backend stores diagram version

Generated flow:

User
----

Generate SRS
------------

Generate class diagram XML
--------------------------

Open XML in Draw.io editor
--------------------------

User edits diagram
------------------

Save updated XML as new diagram version

## SRS Generation Pipeline

The SRS generation pipeline should not ask the LLM to generate everything in one uncontrolled call.

Pipeline:

Raw Requirement Text
--------------------

Summary Component
-----------------

Requirement Extraction Component
--------------------------------

Requirement Classification Component
------------------------------------

SRS Builder
-----------

SRS Document

Each extracted requirement should include:

- requirement_code
- requirement_text
- requirement_type
- nfr_subtype
- source_trace
- extraction_reason
- confidence_score

## Class Diagram Generation

Class diagram generation uses extracted requirements.

Two methods should be supported:

1. LLM-based class diagram generation
2. Rule-based class diagram generation

Output format:

- Draw.io XML

Generated class diagram should be editable inside Draw.io.

## Monorepo Structure

Root:

frontend/
backend/
.specsmd/
README.md
LICENSE

Frontend:

- Yarn
- React
- TypeScript
- Vite

Backend:

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL

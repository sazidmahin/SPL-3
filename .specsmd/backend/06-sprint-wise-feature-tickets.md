# Sprint-Wise Feature Tickets

Recommended project path:

```text
.specsmd/implementation-plan/06-sprint-wise-feature-tickets.md
```

This document breaks the platform into implementation tickets by sprint.  
No story points are included.

---

## Sprint 1: Project Foundation

### TICKET-001: Monorepo Setup

**Feature:** Project folder structure

**What it does:**  
Creates the root project structure with separate `frontend/`, `backend/`, and `.specsmd/` folders. This gives the project a clean separation between React frontend, FastAPI backend, and project specifications.

---

### TICKET-002: Frontend Setup

**Feature:** React TypeScript frontend

**What it does:**  
Initializes the frontend using Yarn, React, TypeScript, and Vite. This provides the base frontend application where authentication, dashboard, Draw.io editor, SRS pages, and billing pages will be built.

---

### TICKET-003: Backend Setup

**Feature:** FastAPI backend

**What it does:**  
Initializes the backend using FastAPI. Adds the base app structure, API router setup, environment configuration, and health check endpoint.

---

### TICKET-004: Database Setup

**Feature:** PostgreSQL database connection

**What it does:**  
Configures PostgreSQL connection for the FastAPI backend using SQLAlchemy. Adds database session management and base model setup.

---

### TICKET-005: Migration Setup

**Feature:** Alembic migrations

**What it does:**  
Adds Alembic migration support so database schema changes can be versioned and applied safely.

---

## Sprint 2: Authentication and Personal Workspace

### TICKET-006: User Model

**Feature:** User account storage

**What it does:**  
Creates the `users` table and backend model for storing user account information such as email, password hash, full name, avatar, and status.

---

### TICKET-007: User Registration API

**Feature:** Register new user

**What it does:**  
Allows a new user to create an account using email, password, and name. Passwords must be hashed before storing.

---

### TICKET-008: Personal Workspace Creation

**Feature:** Automatic personal workspace

**What it does:**  
Automatically creates a personal workspace whenever a new user registers. This allows users to work even if they are not part of any organization.

---

### TICKET-009: Workspace Membership for Personal Workspace

**Feature:** Personal workspace owner membership

**What it does:**  
Creates a `workspace_members` record for the registered user as the owner of their personal workspace.

---

### TICKET-010: User Login API

**Feature:** Login and token generation

**What it does:**  
Allows users to log in and receive an access token for authenticated API requests.

---

### TICKET-011: Current User API

**Feature:** Get authenticated user

**What it does:**  
Returns the currently logged-in user and their available workspaces.

---

### TICKET-012: Frontend Auth Pages

**Feature:** Login and registration UI

**What it does:**  
Creates frontend pages for user registration and login. Connects the forms to the backend authentication APIs.

---

## Sprint 3: Workspace and Tenant Isolation

### TICKET-013: Workspace Model

**Feature:** Workspace tenant boundary

**What it does:**  
Creates the `workspaces` table and model. A workspace can be either `personal` or `organization`.

---

### TICKET-014: Workspace Members Model

**Feature:** Workspace membership and roles

**What it does:**  
Creates the `workspace_members` table and model. Tracks user access to workspaces with roles such as owner, admin, member, and viewer.

---

### TICKET-015: Workspace List API

**Feature:** List user workspaces

**What it does:**  
Returns all personal and organization workspaces where the authenticated user is an active member.

---

### TICKET-016: Organization Workspace Creation API

**Feature:** Create organization workspace

**What it does:**  
Allows users to create an organization workspace and automatically become the owner of that workspace.

---

### TICKET-017: Workspace Access Dependency

**Feature:** Workspace-scoped access control

**What it does:**  
Adds backend dependency logic to verify that the current user is an active member of the requested workspace.

---

### TICKET-018: Workspace Role Permission Dependency

**Feature:** Role-based workspace permissions

**What it does:**  
Adds backend permission checks for owner, admin, member, and viewer roles.

---

### TICKET-019: Tenant Isolation Query Rule

**Feature:** Workspace-scoped queries

**What it does:**  
Ensures all business queries include `workspace_id` so users cannot access data from another personal or organization workspace.

---

### TICKET-020: Workspace Switcher UI

**Feature:** Frontend workspace selector

**What it does:**  
Allows users to switch between their personal workspace and organization workspaces in the frontend.

---

## Sprint 4: Projects

### TICKET-021: Project Model

**Feature:** Project storage

**What it does:**  
Creates the `projects` table and model. Projects belong to a workspace and contain requirement inputs, SRS documents, and diagrams.

---

### TICKET-022: Create Project API

**Feature:** Create project

**What it does:**  
Allows workspace members to create a project inside the selected workspace.

---

### TICKET-023: List Projects API

**Feature:** List workspace projects

**What it does:**  
Returns all active projects for the current workspace.

---

### TICKET-024: Get Project API

**Feature:** View project details

**What it does:**  
Returns project details by `project_id`, scoped by `workspace_id`.

---

### TICKET-025: Update Project API

**Feature:** Edit project

**What it does:**  
Allows permitted users to update project name, description, and status.

---

### TICKET-026: Archive Project API

**Feature:** Archive project

**What it does:**  
Allows users to archive a project without permanently deleting it.

---

### TICKET-027: Project List UI

**Feature:** Frontend project list

**What it does:**  
Displays projects in the selected workspace.

---

### TICKET-028: Project Create UI

**Feature:** Create project page

**What it does:**  
Provides a frontend form to create a new project.

---

### TICKET-029: Project Detail UI

**Feature:** Project workspace page

**What it does:**  
Creates a project detail page where users can access SRS generation, diagrams, and project artifacts.

---

## Sprint 5: Manual Draw.io Diagram Editor

### TICKET-030: Diagram Model

**Feature:** Diagram metadata

**What it does:**  
Creates the `diagrams` table and model for storing diagram metadata such as title, type, source, status, and current version.

---

### TICKET-031: Diagram Version Model

**Feature:** Diagram version storage

**What it does:**  
Creates the `diagram_versions` table and model for storing Draw.io XML versions.

---

### TICKET-032: Create Manual Diagram API

**Feature:** Save manually created diagram

**What it does:**  
Allows users to create a diagram manually and save the first Draw.io XML version.

---

### TICKET-033: Save Diagram Version API

**Feature:** Save edited diagram version

**What it does:**  
Creates a new version each time the user edits and saves a Draw.io diagram.

---

### TICKET-034: List Diagrams API

**Feature:** List project diagrams

**What it does:**  
Returns all diagrams inside a project.

---

### TICKET-035: Get Diagram API

**Feature:** Load diagram

**What it does:**  
Returns diagram metadata and the current Draw.io XML version.

---

### TICKET-036: List Diagram Versions API

**Feature:** Version history

**What it does:**  
Returns all saved versions of a diagram.

---

### TICKET-037: Draw.io Embed Component

**Feature:** Embedded Draw.io editor

**What it does:**  
Adds a frontend component that embeds Draw.io so users can draw and edit diagrams inside the site.

---

### TICKET-038: Draw.io Save Integration

**Feature:** Save XML from Draw.io

**What it does:**  
Captures XML output from the Draw.io editor and sends it to the backend for saving.

---

### TICKET-039: Manual Diagram UI

**Feature:** Manual diagram creation page

**What it does:**  
Allows users to create a blank diagram, open Draw.io, draw manually, and save the result.

---

## Sprint 6: Plans, Subscriptions, and Usage Limits

### TICKET-040: Plan Model

**Feature:** Pricing plan storage

**What it does:**  
Creates the `plans` table and model. Stores plan limits and permissions such as max members, monthly SRS generations, and AI feature access.

---

### TICKET-041: Subscription Model

**Feature:** Workspace subscription storage

**What it does:**  
Creates the `subscriptions` table and model. Subscriptions belong to workspaces and support both personal and organization subscriptions.

---

### TICKET-042: Usage Counter Model

**Feature:** Monthly usage tracking

**What it does:**  
Creates the `usage_counters` table and model to track monthly SRS generation, AI diagram generation, and manual diagram saves.

---

### TICKET-043: Seed Default Plans

**Feature:** Default free and paid plans

**What it does:**  
Creates initial plans such as Free Individual, Individual Pro, Team, and Enterprise.

---

### TICKET-044: Subscription Check Service

**Feature:** Feature access validation

**What it does:**  
Checks whether a workspace subscription allows a requested feature such as AI SRS generation or AI diagram generation.

---

### TICKET-045: Usage Limit Service

**Feature:** Monthly usage enforcement

**What it does:**  
Checks and increments monthly usage counts for paid features.

---

### TICKET-046: Organization Member Limit Check

**Feature:** Enforce max organization members

**What it does:**  
Prevents inviting more organization members than the subscription plan allows.

---

### TICKET-047: Billing API

**Feature:** Plan and subscription endpoints

**What it does:**  
Adds APIs for listing plans, viewing workspace subscription, and viewing current usage.

---

### TICKET-048: Pricing Page UI

**Feature:** Pricing display

**What it does:**  
Shows available plans and explains which features are free and which require paid subscription.

---

### TICKET-049: Billing Page UI

**Feature:** Workspace billing status

**What it does:**  
Shows the selected workspace subscription, usage, and upgrade options.

---

## Sprint 7: Requirement Input and Generation Jobs

### TICKET-050: Requirement Input Model

**Feature:** Raw requirement storage

**What it does:**  
Creates the `requirement_inputs` table and model to store natural-language requirement text submitted by users.

---

### TICKET-051: Generation Job Model

**Feature:** Generation job tracking

**What it does:**  
Creates the `generation_jobs` table and model to track SRS and diagram generation status.

---

### TICKET-052: Create Requirement Input API

**Feature:** Submit raw requirements

**What it does:**  
Allows users to submit natural-language requirements for a project.

---

### TICKET-053: Create Generation Job API

**Feature:** Start generation job

**What it does:**  
Creates a generation job for SRS generation, class diagram generation, or full generation.

---

### TICKET-054: Get Generation Job Status API

**Feature:** Track generation progress

**What it does:**  
Returns job status such as pending, running, completed, failed, or partially completed.

---

### TICKET-055: Generation Job UI

**Feature:** Frontend generation status

**What it does:**  
Shows users whether a generation request is pending, running, completed, or failed.

---

## Sprint 8: SRS Generation Pipeline

### TICKET-056: Prompt Template Model

**Feature:** Versioned prompt storage

**What it does:**  
Creates the `prompt_templates` table and model for storing versioned prompts used by the SRS pipeline.

---

### TICKET-057: LLM Call Model

**Feature:** LLM execution logging

**What it does:**  
Creates the `llm_calls` table and model for storing LLM call metadata, model name, token usage, status, and response payload.

---

### TICKET-058: LLM Client Abstraction

**Feature:** Common LLM interface

**What it does:**  
Creates a backend service abstraction so the application can use different LLM providers without changing pipeline logic.

---

### TICKET-059: Summary Component

**Feature:** Generate summary SRS sections

**What it does:**  
Generates Introduction, Stakeholders, Use Cases, and Glossary from raw natural-language requirements.

---

### TICKET-060: Requirement Extraction Component

**Feature:** Extract structured requirements

**What it does:**  
Extracts clear structured requirements from raw input, including source trace and extraction reason.

---

### TICKET-061: Requirement Classification Component

**Feature:** Classify FR and NFR

**What it does:**  
Classifies extracted requirements as functional or non-functional. Non-functional requirements receive a subtype such as security, performance, availability, or usability.

---

### TICKET-062: SRS Document Model

**Feature:** SRS document storage

**What it does:**  
Creates the `srs_documents` table and model to store generated SRS in markdown and JSON format.

---

### TICKET-063: Extracted Requirement Model

**Feature:** Requirement result storage

**What it does:**  
Creates the `extracted_requirements` table and model to store extracted and classified requirements.

---

### TICKET-064: SRS Builder

**Feature:** Build final SRS document

**What it does:**  
Combines summary sections and classified requirements into a structured SRS document.

---

### TICKET-065: Generate SRS API

**Feature:** AI SRS generation endpoint

**What it does:**  
Runs the full SRS generation pipeline after checking subscription and usage limits.

---

### TICKET-066: SRS Review UI

**Feature:** Review generated SRS

**What it does:**  
Displays generated SRS content, extracted requirements, and classification results to the user.

---

## Sprint 9: Class Diagram Generation

### TICKET-067: Diagram Generator Base Interface

**Feature:** Common diagram generator contract

**What it does:**  
Creates a base interface for all diagram generators so class, use case, sequence, ER, and other diagrams can be added later.

---

### TICKET-068: Diagram Generator Registry

**Feature:** Diagram generator lookup

**What it does:**  
Creates a registry that maps diagram types to generator implementations.

---

### TICKET-069: Class Diagram Context Builder

**Feature:** Requirement-to-diagram context

**What it does:**  
Builds a shared context from extracted requirements for class diagram generation.

---

### TICKET-070: LLM Class Diagram Generator

**Feature:** AI class diagram generation

**What it does:**  
Uses extracted requirements and an LLM prompt to generate class diagram structure and Draw.io-compatible XML.

---

### TICKET-071: Rule-Based Noun Extractor

**Feature:** Entity extraction for rule-based diagrams

**What it does:**  
Extracts nouns and candidate domain entities from requirements for deterministic class diagram generation.

---

### TICKET-072: Rule-Based Class Diagram Generator

**Feature:** Deterministic class diagram generation

**What it does:**  
Generates classes and relationships using noun extraction, requirement patterns, and simple relationship rules.

---

### TICKET-073: Draw.io XML Builder

**Feature:** Convert diagram model to Draw.io XML

**What it does:**  
Converts normalized class diagram data into Draw.io XML format.

---

### TICKET-074: Generate Class Diagram API

**Feature:** Class diagram generation endpoint

**What it does:**  
Allows users to generate class diagrams using LLM, rule-based method, or both.

---

### TICKET-075: Save Generated Class Diagrams

**Feature:** Store generated diagrams

**What it does:**  
Saves generated class diagrams as diagram records and diagram versions.

---

### TICKET-076: Open Generated Diagram in Draw.io

**Feature:** Edit generated class diagram

**What it does:**  
Opens generated Draw.io XML inside the frontend Draw.io editor so users can manually edit and save it.

---

## Sprint 10: SRS and Diagram Integration

### TICKET-077: Full Generation API

**Feature:** Generate SRS and class diagrams together

**What it does:**  
Runs SRS generation and class diagram generation in one request if the user selects full generation.

---

### TICKET-078: SRS-to-Diagram Traceability

**Feature:** Link diagrams to requirements

**What it does:**  
Creates traceability links between diagram elements and extracted requirements where possible.

---

### TICKET-079: Diagram Requirement Link Model

**Feature:** Diagram traceability storage

**What it does:**  
Creates the `diagram_requirement_links` table and model to store requirement-to-diagram-element relationships.

---

### TICKET-080: Full Generation UI

**Feature:** One-page SRS and diagram generation

**What it does:**  
Allows users to submit requirements and generate SRS plus class diagrams from a single frontend page.

---

### TICKET-081: Generated Artifact Review Page

**Feature:** Review SRS and diagrams together

**What it does:**  
Shows the generated SRS, extracted requirements, LLM class diagram, and rule-based class diagram in one review area.

---

## Sprint 11: Export, Permissions, and Polishing

### TICKET-082: Export SRS

**Feature:** Export generated SRS

**What it does:**  
Allows users to export SRS content if their plan allows export.

---

### TICKET-083: Export Diagram

**Feature:** Export Draw.io diagram

**What it does:**  
Allows users to export diagrams if their plan allows export.

---

### TICKET-084: Feature Permission UI Guards

**Feature:** Frontend feature access control

**What it does:**  
Hides or disables paid features when the current workspace plan does not allow them.

---

### TICKET-085: Upgrade Prompt UI

**Feature:** Subscription upgrade messaging

**What it does:**  
Shows a clear upgrade prompt when a user tries to use paid features without an active paid subscription.

---

### TICKET-086: Error Handling

**Feature:** Friendly API and UI errors

**What it does:**  
Adds consistent backend error responses and frontend error display for validation, permission, subscription, and generation failures.

---

### TICKET-087: Audit-Friendly Metadata

**Feature:** Store generation metadata

**What it does:**  
Stores prompt version, model name, generation method, and job ID with generated SRS and diagram artifacts.

---

## Sprint 12: Testing and Hardening

### TICKET-088: Unit Tests for Tenant Isolation

**Feature:** Workspace access safety tests

**What it does:**  
Tests that users cannot access projects, diagrams, SRS documents, or jobs from another workspace.

---

### TICKET-089: Unit Tests for Subscription Checks

**Feature:** Paid feature validation tests

**What it does:**  
Tests that unpaid users cannot generate SRS or AI diagrams and that paid users can.

---

### TICKET-090: Unit Tests for Organization Member Limits

**Feature:** Max member enforcement tests

**What it does:**  
Tests that organization workspaces cannot exceed the member limit defined by the subscription plan.

---

### TICKET-091: Unit Tests for SRS Pipeline Components

**Feature:** Pipeline component tests

**What it does:**  
Tests Summary Component, Requirement Extraction Component, Requirement Classification Component, and SRS Builder independently.

---

### TICKET-092: Unit Tests for Diagram Generators

**Feature:** Class diagram generator tests

**What it does:**  
Tests LLM output parsing, rule-based noun extraction, class diagram model creation, and Draw.io XML building.

---

### TICKET-093: Integration Test for Manual Diagram Flow

**Feature:** Draw.io save/load integration test

**What it does:**  
Tests creating a manual diagram, saving XML, loading it again, and saving a new version.

---

### TICKET-094: Integration Test for Full Generation Flow

**Feature:** End-to-end AI generation test

**What it does:**  
Tests submitting raw requirements, generating SRS, extracting requirements, generating class diagrams, and saving artifacts.

---

### TICKET-095: Documentation Cleanup

**Feature:** Developer documentation

**What it does:**  
Updates README and `.specsmd` files so future development agents understand the architecture and implementation plan.

---

## Backlog for Later Releases

### BACKLOG-001: Use Case Diagram Generation

**Feature:** Generate use case diagrams

**What it does:**  
Adds a use case diagram generator using extracted actors, use cases, and system boundaries.

---

### BACKLOG-002: Sequence Diagram Generation

**Feature:** Generate sequence diagrams

**What it does:**  
Adds sequence diagram generation from requirement flows and interactions.

---

### BACKLOG-003: ER Diagram Generation

**Feature:** Generate ER diagrams

**What it does:**  
Adds ER diagram generation from entities, attributes, and relationships.

---

### BACKLOG-004: Activity Diagram Generation

**Feature:** Generate activity diagrams

**What it does:**  
Adds activity diagram generation from workflows and business process descriptions.

---

### BACKLOG-005: State Diagram Generation

**Feature:** Generate state diagrams

**What it does:**  
Adds state diagram generation for entities that have lifecycle states.

---

### BACKLOG-006: Requirement File Upload

**Feature:** Upload requirement source files

**What it does:**  
Allows users to upload documents or transcripts as requirement sources.

---

### BACKLOG-007: Team Review Workflow

**Feature:** Review and approval process

**What it does:**  
Allows workspace members to comment on, approve, or request changes to generated SRS documents and diagrams.

---

### BACKLOG-008: Advanced Billing Provider Integration

**Feature:** Payment provider integration

**What it does:**  
Integrates a real payment provider such as Stripe for checkout, invoices, and subscription lifecycle events.

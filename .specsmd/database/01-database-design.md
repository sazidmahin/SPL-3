# Database Design

Core tables:

- users
- workspaces
- workspace_members
- plans
- subscriptions
- usage_counters
- projects
- requirement_inputs
- generation_jobs
- srs_documents
- extracted_requirements
- diagrams
- diagram_versions
- diagram_requirement_links
- prompt_templates
- llm_calls
- admin_audit_logs
- platform_settings
- payment_customers
- invoices


### Super Admin Support

The system supports platform-level administrators.

The `users` table includes:

- platform_role VARCHAR -- user, support_admin, super_admin
- is_platform_admin BOOLEAN DEFAULT FALSE

Super admins can access platform-level admin APIs.

Normal workspace APIs must still enforce workspace_id tenant isolation.

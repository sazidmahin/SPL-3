# FastAPI Modules

## API Routes

auth.py:

- register
- login
- current user

workspaces.py:

- list user workspaces
- create organization workspace
- get workspace
- invite member
- list members

projects.py:

- create project
- list projects
- get project
- update project
- archive project

srs.py:

- create requirement input
- generate SRS
- get SRS document
- list SRS documents

diagrams.py:

- create manual diagram
- save Draw.io XML
- get diagram
- list diagrams
- list diagram versions
- generate class diagram

generation_jobs.py:

- get job status
- list project jobs

billing.py:

- list plans
- get current subscription
- create checkout session later
- get usage

## Dependency Layer

deps.py should provide:

- get_db
- get_current_user
- get_current_workspace
- require_workspace_member
- require_workspace_role
- require_active_subscription_for_feature

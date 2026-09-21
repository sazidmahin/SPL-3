
# Subscription and Billing Rules

The platform supports two subscription modes:

1. Individual subscription
2. Organization subscription

## Individual Subscription

Used by personal workspaces.

Rules:

- User can work without belonging to any organization.
- Personal workspace is created automatically after registration.
- Individual paid plan allows AI SRS generation.
- Individual workspace max member count is 1.

## Organization Subscription

Used by organization workspaces.

Rules:

- Organization workspace can have multiple members.
- Plan controls maximum member count.
- Owner/admin can invite members only if active member count is below plan.max_members.
- Organization subscription controls AI features for all members of the workspace.

## Feature Access

Free:

- Login/register
- Personal workspace
- Limited projects
- Manual Draw.io editor
- Limited diagram saves

Paid Individual:

- Manual Draw.io editor
- AI SRS generation
- AI class diagram generation
- Export SRS
- Export diagrams

Paid Organization:

- Manual Draw.io editor
- AI SRS generation
- AI class diagram generation
- Member management
- Shared projects
- Export SRS
- Export diagrams

## Subscription Check for SRS Generation

User requests SRS generation
----------------------------

Check workspace membership
--------------------------

Check active subscription
-------------------------

Check plan.can_generate_srs
---------------------------

Check usage limit
-----------------

Allow or reject request

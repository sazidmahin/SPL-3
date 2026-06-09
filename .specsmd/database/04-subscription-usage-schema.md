# Subscription and Usage Schema

Subscriptions belong to workspaces.

This supports both:

- personal workspace subscriptions
- organization workspace subscriptions

## Plans

plans.max_members controls how many active users can be in an organization workspace.

plans.monthly_srs_generations controls monthly AI SRS generation count.

plans.monthly_ai_diagram_generations controls monthly AI diagram generation count.

plans.can_generate_srs controls whether the workspace can use SRS generation.

plans.can_generate_ai_diagrams controls whether the workspace can use AI diagram generation.

## Usage Check Flow

User requests AI SRS generation
-------------------------------

Check workspace membership
--------------------------

Get active subscription
-----------------------

Get plan
--------

Check plan.can_generate_srs
---------------------------

Get current usage counter
-------------------------

Check usage count against monthly_srs_generations
-------------------------------------------------

If allowed, create generation job
---------------------------------

Increment usage count

## Organization Invite Flow

Owner/admin invites member
--------------------------

Check workspace.type = organization
-----------------------------------

Get active subscription
-----------------------

Get plan.max_members
--------------------

Count active members
--------------------

If active members >= max_members, reject invite
-----------------------------------------------

Else create invited workspace member

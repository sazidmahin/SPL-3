# AI SRS Generation

AI SRS generation is a paid feature.

Before generation:

- check workspace membership
- check active subscription
- check plan.can_generate_srs
- check monthly usage limit

Flow:

User submits natural-language requirement
-----------------------------------------

FastAPI receives request
------------------------

Create requirement_input
------------------------

Create generation_job
---------------------

Run Summary Component
---------------------

Run Requirement Extraction Component
------------------------------------

Run Requirement Classification Component
----------------------------------------

Build SRS document
------------------

Store SRS document
------------------

Store extracted requirements
----------------------------

Return result

Generation job statuses:

- pending
- running
- completed
- failed
- partially_completed

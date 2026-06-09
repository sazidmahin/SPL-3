# User Journey

User
----

Login / Register
----------------

System creates personal workspace
---------------------------------

User selects personal workspace or organization workspace
---------------------------------------------------------

Dashboard
---------

Create project
--------------

Open project workspace
----------------------

Use manual Draw.io editor
-------------------------

Save manual diagram
-------------------

Request AI SRS generation
-------------------------

Backend checks workspace subscription
-------------------------------------

If subscription inactive, show upgrade page
-------------------------------------------

If subscription active, submit natural-language requirement
-----------------------------------------------------------

FastAPI backend receives request
--------------------------------

Create generation job
---------------------

Store raw requirement input
---------------------------

Run Summary Component
---------------------

Run Requirement Extraction Component
------------------------------------

Run Requirement Classification Component
----------------------------------------

Generate SRS document
---------------------

Generate shared requirement context
-----------------------------------

Generate LLM-based class diagram XML
------------------------------------

Generate rule-based class diagram XML
-------------------------------------

Open generated XML in Draw.io editor
------------------------------------

User edits diagram
------------------

Save diagram version
--------------------

Export SRS or diagram

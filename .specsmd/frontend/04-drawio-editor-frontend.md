# Draw.io Editor Frontend

The frontend must support embedded Draw.io.

Main components:

- DrawioEmbed.tsx
- DrawioToolbar.tsx

Main pages:

- DiagramListPage.tsx
- DrawioEditorPage.tsx
- DiagramReviewPage.tsx

## Manual Diagram Flow

User opens DrawioEditorPage
---------------------------

Frontend loads Draw.io iframe/editor
------------------------------------

User draws diagram
------------------

User clicks save
----------------

Frontend receives Draw.io XML
-----------------------------

Frontend calls backend diagram save API

## Generated Diagram Flow

User generates class diagram
----------------------------

Backend returns Draw.io XML
---------------------------

Frontend opens Draw.io editor with that XML
-------------------------------------------

User edits
----------

User saves
----------

Backend creates new diagram version

## Backend Storage

Save XML to:

diagram_versions.drawio_xml

## Required frontend behavior

- Load blank editor
- Load existing XML
- Save XML
- Show current version
- Show previous versions
- Allow export if subscription allows

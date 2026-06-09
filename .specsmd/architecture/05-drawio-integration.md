# Draw.io Integration

Draw.io will be integrated into the frontend as a diagram editor.

The platform supports two diagram flows:

Manual Diagram Flow:
User
----

Open Draw.io editor
-------------------

Draw diagram manually
---------------------

Save Draw.io XML
----------------

Backend stores diagram version

Generated Diagram Flow:
User
----

Generate SRS
------------

Generate class diagram XML
--------------------------

Open XML inside Draw.io editor
------------------------------

User edits generated diagram
----------------------------

Save new diagram version

Draw.io XML must be stored in diagram_versions.drawio_xml.

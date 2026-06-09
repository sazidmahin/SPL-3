# ADR-004: Integrate Draw.io as Diagram Editor

## Status

Accepted

## Context

Users should be able to manually draw diagrams and edit generated diagrams.

## Decision

Integrate Draw.io as an embedded editor in the frontend.

Store Draw.io XML in diagram_versions.drawio_xml.

## Consequences

The system supports:

- manual diagram creation
- generated diagram editing
- diagram versioning
- future diagram types

# ADR-001: Choice of MongoDB with Denormalized Data Mart Reporting Collections

## Status
Accepted

## Context
CCMS needs to store complex operational entities (complaints, workflows, timeline entries, student & faculty profiles) while serving real-time Power BI analytics without degrading live transaction performance.

## Decision
We choose MongoDB as our primary transactional store, combined with asynchronous reporting aggregation jobs that populate denormalized "Reporting Collections" (`reportingComplaintFact`, `reportingFacultyFact`, `reportingStudentFact`, `reportingDailySnapshot`).

## Consequences
### Positive
- Flexible document schema for complaint attachments, timeline arrays, and dynamic workflow state metadata.
- Operational collections stay fast and lean; analytical aggregations operate against dedicated data marts.
- Direct read optimization for Power BI dashboards without blocking primary API handlers.

### Negative
- Eventual consistency delay (typically < 10 seconds) between operational updates and Power BI data mart sync.

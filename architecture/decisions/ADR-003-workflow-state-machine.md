# ADR-003: Declarative Workflow Engine for Complaint Lifecycle Management

## Status
Accepted

## Context
Complaints undergo complex lifecycle transitions (Submitted -> Escalated -> Assigned -> In Progress -> Resolved -> Closed / Reopened) with dynamic rules depending on severity, department, and custom SLAs.

## Decision
Build a formal, declarative Workflow Engine in `backend/src/domains/workflow/` featuring transition guards, automated actions, condition validators, and configurable SLA rules.

## Consequences
### Positive
- Eliminates hardcoded `if/else` logic scattered across controllers.
- Enables easy customization of routing rules per campus or department.
- Maintains strict state transition validation and full audit history.

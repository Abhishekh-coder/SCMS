# ADR-004: Decoupled Reporting Data Mart for Power BI Integration

## Status
Accepted

## Context
Directly querying live operational database collections for complex Power BI dashboard visualizations causes database lock contention and slow dashboard render speeds.

## Decision
Establish an operational data pipeline (Operational Collection -> Event Bus -> Aggregation Scheduler -> Reporting Collections -> Power BI Connector) utilizing specialized denormalized data marts (`reportingComplaintFact`, `reportingDailySnapshot`).

## Consequences
### Positive
- Power BI queries execute against pre-computed, indexed analytical facts.
- Zero impact on operational API latency during high dashboard usage.
- Simplified DAX measures on optimized relational-style schemas.

# ADR-005: Choice of Modular Monolith Architecture

## Status
Accepted

## Context
Microservices add operational complexity (distributed transactions, complex deployment setups, network latency) prematurely for Phase 1.

## Decision
Adopt a Modular Monolith architecture with strict domain boundaries inside `backend/src/domains/`. Each domain encapsulates its routes, logic, and schemas, communicating via clean service interfaces or the asynchronous Event Bus.

## Consequences
### Positive
- Single deployment artifact with clear domain boundaries.
- Simplified local development and testing environment.
- Straightforward future refactoring into microservices if needed.

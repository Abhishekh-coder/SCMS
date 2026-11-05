# ADR-002: Role-Based and Attribute-Based Access Control (RBAC/ABAC)

## Status
Accepted

## Context
A campus ecosystem involves diverse user roles (Student, Faculty, Department Head, Warden, Admin, Registrar) with fine-grained security policies based on department, campus site, hostel block, and complaint sensitivity.

## Decision
Implement a decoupled authorization layer in `backend/src/security/` combining static Role-Based Access Control (RBAC) matrix checking with dynamic Attribute-Based Access Control (ABAC) policy rules.

## Consequences
### Positive
- Strict separation between authentication (who you are) and authorization (what you can do).
- Flexible contextual policy evaluation (e.g. "Department Head can only view complaints within their department").
- Multi-tenancy isolation (`tenantId`, `campusId`) enforced at policy evaluation boundaries.

### Negative
- Requires maintainable policy definitions to avoid authorization latency.

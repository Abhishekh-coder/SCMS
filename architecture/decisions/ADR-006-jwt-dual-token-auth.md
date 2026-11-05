# ADR-006: Dual-Token JWT (Access & Refresh) Authentication Pattern

## Status
Accepted

## Context
Stateless REST APIs require secure, scalable authentication with minimal database lookup for short-lived access requests and instant revocation capabilities via refresh token blacklisting.

## Decision
Use JWT Access Tokens (15 min expiration) passed in Authorization headers, paired with HTTP-only Refresh Tokens (7 days expiration) stored in the `refreshTokens` MongoDB collection.

## Consequences
### Positive
- Stateless authorization check for normal requests.
- Secure refresh token rotation and revoke capability upon logout or security compromise.

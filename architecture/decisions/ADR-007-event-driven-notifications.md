# ADR-007: Asynchronous Decoupled Domain Event Bus Architecture

## Status
Accepted

## Context
Actions such as complaint creation trigger multiple side-effects (notifications, audit logging, escalation timer schedules, reporting analytics updates). Tight coupling in controllers leads to slow responses and brittle code.

## Decision
Implement a central Event Bus (`backend/src/events/eventBus.js`) publishing strongly typed domain events (`ComplaintCreated`, `ComplaintAssigned`, `ComplaintEscalated`, `ComplaintResolved`, `ComplaintClosed`, `UserLoggedIn`).

## Consequences
### Positive
- Completely decouples side-effect consumers from core domain request handlers.
- Easily add new event listeners (e.g. WhatsApp notifications, AI analysis) without modifying complaint controller.

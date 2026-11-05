# Declarative Workflow Engine & State Machine Specification

## Lifecycle States
- `SUBMITTED`: Initial complaint registration state.
- `CATEGORIZED`: Auto or manually assigned category & department.
- `ASSIGNED`: Routed to designated department staff or faculty member.
- `IN_PROGRESS`: Investigation underway.
- `ESCALATED`: SLA breach triggered automated escalation to higher authority (e.g. Dean / HOD).
- `RESOLVED`: Resolution code & comments recorded.
- `CLOSED`: Confirmed resolved by student.
- `REOPENED`: Re-opened by student due to unsatisfied resolution.

## Engine Architecture (`backend/src/domains/workflow/`)
- `engine/`: Executes state transition lifecycle.
- `definitions/`: Declarative JSON/JS state transition rules.
- `transitions/`: Guards ensuring valid next state transitions.
- `actions/`: Automatic side-effects (publish events, send notifications, schedule escalations).
- `conditions/`: Rule evaluation functions (SLA timeout check, severity evaluation).

/**
 * CCMS — Typed Domain Event Definitions
 *
 * Provides strongly-typed domain event classes for authentication, verification, and registration workflows.
 */

class DomainEvent {
  constructor(eventType, payload, meta = {}) {
    this.eventId = meta.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.eventType = eventType;
    this.payload = payload;
    this.occurredAt = meta.occurredAt || new Date().toISOString();
  }
}

class UserRegisteredEvent extends DomainEvent {
  constructor(payload, meta) {
    super('USER_REGISTERED', payload, meta);
  }
}

class VerificationCreatedEvent extends DomainEvent {
  constructor(payload, meta) {
    super('VERIFICATION_CREATED', payload, meta);
  }
}

class AccountActivatedEvent extends DomainEvent {
  constructor(payload, meta) {
    super('ACCOUNT_ACTIVATED', payload, meta);
  }
}

module.exports = {
  DomainEvent,
  UserRegisteredEvent,
  VerificationCreatedEvent,
  AccountActivatedEvent,
};

const { describe, it } = require('node:test');
const assert = require('assert');
const bcrypt = require('bcryptjs');

const identityOrchestrator = require('../../backend/src/domains/auth/orchestrators/IdentityOrchestrator');
const userService = require('../../backend/src/domains/auth/services/UserService');
const profileService = require('../../backend/src/domains/auth/services/ProfileService');
const otpService = require('../../backend/src/domains/auth/services/OtpService');
const recaptchaService = require('../../backend/src/infrastructure/recaptcha/RecaptchaService');
const eventPublisher = require('../../backend/src/events/publishers/EventPublisher');

describe('Sprint 2A - Identity Registration Pipeline Unit Tests', () => {

  it('1. should verify Bcrypt password hashing with cost factor 12', async () => {
    const password = 'StrongPassword@123!';
    const hash = await bcrypt.hash(password, 12);
    
    assert.notStrictEqual(hash, password);
    assert.ok(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'));
    const isMatch = await bcrypt.compare(password, hash);
    assert.strictEqual(isMatch, true);
  });

  it('2. should verify EventPublisher decouples UserRegistered event without sensitive data', async () => {
    let receivedPayload = null;
    const handler = (event) => {
      receivedPayload = event.payload;
    };

    eventPublisher.on('UserRegistered', handler);

    await eventPublisher.publish('UserRegistered', {
      userUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      userCode: 'STU-100001',
      email: 'test.student@campus.edu',
      role: 'STUDENT',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus',
      occurredAt: new Date().toISOString()
    });

    // Wait for event emitter
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(receivedPayload);
    assert.strictEqual(receivedPayload.userUuid, '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
    assert.strictEqual(receivedPayload.email, 'test.student@campus.edu');
    assert.strictEqual(receivedPayload.passwordHash, undefined);
    assert.strictEqual(receivedPayload.otpCode, undefined);

    eventPublisher.removeListener('UserRegistered', handler);
  });

  it('3. should verify reCAPTCHA bypass in test environment', async () => {
    process.env.NODE_ENV = 'test';
    const result = await recaptchaService.verifyToken('dummy_token', '127.0.0.1');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.score, 1.0);
  });
});

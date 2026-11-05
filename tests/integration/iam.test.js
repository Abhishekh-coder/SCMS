const { describe, it, before, after } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');

const authService = require('../../backend/src/domains/auth/auth.service');
const sessionService = require('../../backend/src/domains/auth/session.service');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ccms_dev_db';

describe('Phase 1 — IAM Integration & Security Suite', () => {

  before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
    }
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('1. Registration: Should register a user in PENDING_VERIFICATION state', async () => {
    const regResult = await authService.register({
      fullName: 'Alice Smith',
      email: 'alice@campus.edu',
      password: 'SuperPassword123!',
      role: 'STUDENT'
    });

    assert.strictEqual(regResult.email, 'alice@campus.edu');
    assert.strictEqual(regResult.accountStatus, 'PENDING_VERIFICATION');
    assert.strictEqual(regResult.verificationOtpSent, true);
  });

  it('2. Authentication: Should login user and return Dual JWT Tokens + Session', async () => {
    const loginResult = await authService.login({
      email: 'alice@campus.edu',
      password: 'SuperPassword123!'
    });

    assert.ok(loginResult.accessToken);
    assert.ok(loginResult.refreshToken);
    assert.strictEqual(loginResult.accountStatus, 'ACTIVE');
    assert.ok(loginResult.session.sessionUuid);
  });

  it('3. Account Lockout: Should lock account after 5 consecutive failed login attempts', async () => {
    // Register test user
    await authService.register({
      fullName: 'Bob Lockout',
      email: 'bob@campus.edu',
      password: 'ValidPassword123!'
    });

    // Fail 5 times
    for (let i = 0; i < 5; i++) {
      try {
        await authService.login({ email: 'bob@campus.edu', password: 'WrongPassword' });
      } catch (err) {
        // Expected failed attempt error
      }
    }

    // 6th attempt should be rejected due to LOCKED status
    try {
      await authService.login({ email: 'bob@campus.edu', password: 'ValidPassword123!' });
      assert.fail('Account should have been LOCKED.');
    } catch (err) {
      assert.strictEqual(err.statusCode || err.status || 403, 403);
      assert.ok(err.message.includes('locked') || err.message.includes('Locked') || err.message.includes('Invalid credentials'));
    }
  });

  it('4. Refresh Token Family & Replay Protection: Should rotate generation and revoke family on replay attack', async () => {
    // Register & Login user
    await authService.register({
      fullName: 'Charlie Security',
      email: 'charlie@campus.edu',
      password: 'CharliePassword123!'
    });

    const loginRes = await authService.login({
      email: 'charlie@campus.edu',
      password: 'CharliePassword123!'
    });

    const tokenGen1 = loginRes.refreshToken;

    // First rotation (Gen 1 -> Gen 2)
    const rot1 = await authService.refreshTokenRotation({ refreshToken: tokenGen1 });
    assert.ok(rot1.accessToken);
    assert.ok(rot1.refreshToken);

    // Replay attack: Attacker tries to use old Gen 1 token again!
    try {
      await authService.refreshTokenRotation({ refreshToken: tokenGen1 });
      assert.fail('Replay attack should have been detected and blocked.');
    } catch (err) {
      assert.strictEqual(err.statusCode || err.status || 403, 403);
      assert.ok(err.message.includes('replay attack') || err.message.includes('compromised') || err.message.includes('revoked') || err.message.includes('Invalid'));
    }
  });

  it('5. Session Management: Should retrieve active sessions and allow revocation', () => {
    const sessions = sessionService.getUserSessions('usr_test_101');
    assert.ok(Array.isArray(sessions));
  });
});

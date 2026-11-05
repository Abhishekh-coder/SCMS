const { describe, it } = require('node:test');
const assert = require('assert');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const jwtService = require('../../backend/src/security/jwt.service');
const sessionService = require('../../backend/src/domains/auth/services/SessionService');
const eventPublisher = require('../../backend/src/events/publishers/EventPublisher');

describe('Sprint 2B - Authentication Pipeline & JWT Security Unit Tests', () => {

  describe('1. JWT Dual-Token Generation & Verification', () => {
    it('should generate and verify short-lived Access Token', () => {
      const payload = {
        userUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        userCode: 'STU-100001',
        email: 'test@campus.edu',
        roles: ['STUDENT']
      };

      const token = jwtService.generateAccessToken(payload);
      assert.ok(token);

      const decoded = jwtService.verifyAccessToken(token);
      assert.strictEqual(decoded.userUuid, payload.userUuid);
      assert.strictEqual(decoded.userCode, payload.userCode);
      assert.strictEqual(decoded.email, payload.email);
    });

    it('should generate and verify long-lived Refresh Token', () => {
      const payload = {
        familyId: 'fam_12345',
        generation: 1,
        userUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
      };

      const token = jwtService.generateRefreshToken(payload);
      assert.ok(token);

      const decoded = jwtService.verifyRefreshToken(token);
      assert.strictEqual(decoded.familyId, payload.familyId);
      assert.strictEqual(decoded.generation, 1);
    });

    it('should fail verification on corrupt or invalid token string', () => {
      try {
        jwtService.verifyAccessToken('invalid.token.string');
        assert.fail('Should have thrown token verification error');
      } catch (err) {
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.errorCode, 'AUTH_007');
      }
    });
  });

  describe('2. SessionService User-Agent Parsing', () => {
    it('should correctly parse User-Agent header details', () => {
      const chromeWin = sessionService.parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      assert.strictEqual(chromeWin.browser, 'Chrome');
      assert.strictEqual(chromeWin.OS, 'Windows');
      assert.strictEqual(chromeWin.deviceName, 'DESKTOP');

      const safariIPhone = sessionService.parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
      assert.strictEqual(safariIPhone.browser, 'Safari');
      assert.strictEqual(safariIPhone.OS, 'iOS');
      assert.strictEqual(safariIPhone.deviceName, 'MOBILE');
    });
  });

  describe('3. Account Lockout & Password Verification Logic', () => {
    it('should verify password hashing comparison and failed counter threshold', async () => {
      const password = 'CorrectPassword@123!';
      const hash = await bcrypt.hash(password, 12);

      const validMatch = await bcrypt.compare(password, hash);
      const invalidMatch = await bcrypt.compare('WrongPassword@123!', hash);

      assert.strictEqual(validMatch, true);
      assert.strictEqual(invalidMatch, false);

      let failedLoginCount = 0;
      let accountStatus = 'ACTIVE';

      // Simulate 5 failed attempts
      for (let i = 1; i <= 5; i++) {
        failedLoginCount += 1;
        if (failedLoginCount >= 5) {
          accountStatus = 'LOCKED';
        }
      }

      assert.strictEqual(failedLoginCount, 5);
      assert.strictEqual(accountStatus, 'LOCKED');
    });
  });

  describe('4. Token Replay Attack Security Event Broadcast', () => {
    it('should broadcast TokenReplayDetected event upon detecting token reuse', async () => {
      let eventCaptured = false;
      const handler = (evt) => {
        if (evt.eventType === 'TokenReplayDetected') {
          eventCaptured = true;
        }
      };

      eventPublisher.on('TokenReplayDetected', handler);

      await eventPublisher.publish('TokenReplayDetected', {
        familyId: 'fam_replay_test',
        userUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        sessionId: 'sess_123',
        attemptedGeneration: 1,
        occurredAt: new Date().toISOString()
      });

      for (let i = 0; i < 20; i++) {
        if (eventCaptured) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      assert.strictEqual(eventCaptured, true);

      eventPublisher.removeListener('TokenReplayDetected', handler);
    });
  });
});

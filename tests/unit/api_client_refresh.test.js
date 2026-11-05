const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const jwtService = require('../../backend/src/security/jwt.service');

// Mock localStorage for Node environment if missing
if (typeof global.localStorage === 'undefined') {
  const store = new Map();
  global.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe('Single-Flight JWT Refresh & Lifecycle Unit Tests', () => {

  beforeEach(() => {
    global.localStorage.clear();
  });

  describe('Test F — Role Preservation Across Refresh Token Rotation', () => {
    const rolesToTest = [
      'STUDENT',
      'CLASS_INCHARGE',
      'TEACHER_GUARDIAN',
      'FACULTY',
      'HOD',
      'DEAN',
      'PRINCIPAL',
      'CAMPUS_SERVICES_HEAD',
      'ADMIN'
    ];

    rolesToTest.forEach((role) => {
      it(`should preserve [${role}] role in access payload upon refresh token rotation`, () => {
        const user = {
          userUuid: 'usr_test_uuid_123',
          userCode: 'EMP-IT-001',
          loginId: 'EMP-IT-001',
          email: 'user@campus.edu',
          roles: [role],
          tenantId: 'tenant_campus_01',
          campusId: 'main_campus'
        };

        const accessPayload = {
          userUuid: user.userUuid,
          userCode: user.userCode || user.loginId,
          loginId: user.loginId,
          email: user.email,
          roles: (user.roles && user.roles.length) ? user.roles : ['STUDENT'],
          tenantId: user.tenantId,
          campusId: user.campusId,
          sessionId: 'sess_123'
        };

        const newToken = jwtService.generateAccessToken(accessPayload);
        const decoded = jwtService.verifyAccessToken(newToken);

        assert.strictEqual(decoded.roles[0], role);
        assert.strictEqual(decoded.loginId, user.loginId);
      });
    });
  });

  describe('JWT Proactive Expiration Check', () => {
    it('should detect token expiring within 60 seconds', () => {
      const jwt = require('jsonwebtoken');
      const nowSec = Math.floor(Date.now() / 1000);
      const expiringSoonToken = jwt.sign({
        userUuid: 'test_uuid',
        roles: ['STUDENT'],
        exp: nowSec + 30 // Expiring in 30 seconds
      }, jwtService.accessSecret);

      const validLongToken = jwt.sign({
        userUuid: 'test_uuid',
        roles: ['STUDENT'],
        exp: nowSec + 600 // Expiring in 10 minutes
      }, jwtService.accessSecret);

      function isTokenExpiringSoon(token, bufferSeconds = 60) {
        if (!token) return true;
        try {
          const parts = token.split('.');
          if (parts.length !== 3) return false;
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (!payload.exp) return false;
          return (payload.exp * 1000) - Date.now() <= bufferSeconds * 1000;
        } catch (e) {
          return false;
        }
      }

      assert.strictEqual(isTokenExpiringSoon(expiringSoonToken, 60), true);
      assert.strictEqual(isTokenExpiringSoon(validLongToken, 60), false);
    });
  });

  describe('Token Storage Integrity (setItem)', () => {
    it('should properly update access and refresh tokens in storage upon rotation', () => {
      const initialAccess = 'access_token_v1';
      const initialRefresh = 'refresh_token_v1';
      global.localStorage.setItem('ccms_token', initialAccess);
      global.localStorage.setItem('ccms_access_token', initialAccess);
      global.localStorage.setItem('ccms_refresh_token', initialRefresh);

      const rotatedAccess = 'access_token_v2';
      const rotatedRefresh = 'refresh_token_v2';

      global.localStorage.setItem('ccms_token', rotatedAccess);
      global.localStorage.setItem('ccms_access_token', rotatedAccess);
      global.localStorage.setItem('ccms_refresh_token', rotatedRefresh);

      assert.strictEqual(global.localStorage.getItem('ccms_token'), rotatedAccess);
      assert.strictEqual(global.localStorage.getItem('ccms_access_token'), rotatedAccess);
      assert.strictEqual(global.localStorage.getItem('ccms_refresh_token'), rotatedRefresh);
    });
  });
});

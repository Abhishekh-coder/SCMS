const { describe, it } = require('node:test');
const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwtService = require('../../backend/src/security/jwt.service');
const sessionService = require('../../backend/src/domains/auth/services/SessionService');

describe('Sprint 2B Release Gate Review & Latency Benchmarks', () => {

  it('1. Benchmark JWT Verification Latency Target (< 100 ms)', () => {
    const token = jwtService.generateAccessToken({
      userUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      email: 'bench@campus.edu',
      roles: ['STUDENT']
    });

    const start = performance.now();
    const decoded = jwtService.verifyAccessToken(token);
    const duration = performance.now() - start;

    assert.ok(decoded);
    assert.ok(duration < 100, `JWT verification duration ${duration.toFixed(2)}ms exceeded target 100ms`);
  });

  it('2. Benchmark User-Agent Session Parsing Latency Target (< 50 ms)', () => {
    const start = performance.now();
    const parsed = sessionService.parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    const duration = performance.now() - start;

    assert.strictEqual(parsed.browser, 'Chrome');
    assert.ok(duration < 50, `User-agent parsing ${duration.toFixed(2)}ms exceeded 50ms target`);
  });

  it('3. Benchmark Bcrypt Password Hashing Latency Target (< 1200 ms)', async () => {
    const start = performance.now();
    await bcrypt.hash('TestPassword123!', 12);
    const duration = performance.now() - start;
    console.log(`⏱️ Bcrypt Hash Cost Factor 12 Latency: ${duration.toFixed(4)} ms`);
    assert.strictEqual(duration < 1200, true, `Bcrypt cost factor 12 hashing ${duration.toFixed(2)}ms exceeded target 1200ms`);
  });
});

const { describe, it, afterEach } = require('node:test');
const assert = require('assert');
const { validateEnvironment, sanitizeMongoUri } = require('../../backend/src/config/validateEnvironment');

describe('Step 7 — Production Configuration & Deployment Readiness Tests', () => {

  describe('1. Mongo URI Masking & Log Sanitization', () => {
    it('should mask credentials in mongodb+srv URIs', () => {
      const uri = 'mongodb+srv://admin_user:superSecretPass123!@cluster0.abcde.mongodb.net/ccms_prod_db?retryWrites=true';
      const masked = sanitizeMongoUri(uri);
      assert.strictEqual(masked.includes('superSecretPass123!'), false);
      assert.strictEqual(masked, 'mongodb+srv://admin_user:*****@cluster0.abcde.mongodb.net/ccms_prod_db?retryWrites=true');
    });

    it('should mask credentials in standard mongodb:// URIs', () => {
      const uri = 'mongodb://prod_app:p%40ssw0rd@10.0.1.50:27017/ccms_db?authSource=admin';
      const masked = sanitizeMongoUri(uri);
      assert.strictEqual(masked.includes('p%40ssw0rd'), false);
      assert.strictEqual(masked, 'mongodb://prod_app:*****@10.0.1.50:27017/ccms_db?authSource=admin');
    });

    it('should leave URIs without credentials unmasked', () => {
      const uri = 'mongodb://127.0.0.1:27017/ccms_dev_db';
      const masked = sanitizeMongoUri(uri);
      assert.strictEqual(masked, 'mongodb://127.0.0.1:27017/ccms_dev_db');
    });
  });

  describe('2. Fail-Fast Production Environment Validation', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('should pass validation in development mode with defaults', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.MONGO_URI;
      delete process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      const result = validateEnvironment();
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
      assert.ok(result.warnings.length > 0);
    });

    it('should fail fast in production if MONGO_URI is missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.MONGO_URI;
      delete process.env.MONGODB_URI;
      process.env.JWT_ACCESS_SECRET = 'a'.repeat(64);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(64);

      const result = validateEnvironment();
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('MONGO_URI is required')));
    });

    it('should fail fast in production if JWT_ACCESS_SECRET is a development placeholder', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGO_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/prod';
      process.env.JWT_ACCESS_SECRET = 'dev_jwt_access_secret_key_32chars_min_length';
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(64);

      const result = validateEnvironment();
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('JWT_ACCESS_SECRET is set to an insecure development placeholder')));
    });

    it('should fail fast in production if JWT_REFRESH_SECRET is under 32 characters', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGO_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/prod';
      process.env.JWT_ACCESS_SECRET = 'a'.repeat(64);
      process.env.JWT_REFRESH_SECRET = 'short_secret_123';

      const result = validateEnvironment();
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('JWT_REFRESH_SECRET must be at least 32 characters')));
    });

    it('should succeed in production with high-entropy secrets and remote cluster URI', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGO_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/prod';
      process.env.JWT_ACCESS_SECRET = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      process.env.JWT_REFRESH_SECRET = 'ca978112ca1bbdcdaf83762244d4514040a340798e3b33457193c3732486f059';
      process.env.CORS_ALLOWED_ORIGINS = 'https://ccms.campus.edu';

      const result = validateEnvironment();
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('3. Production Safe Error Response Shielding', () => {
    const { globalErrorHandler } = require('../../backend/src/middleware/errorHandler');

    it('should shield internal 500 error messages from client in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const internalErr = new Error('MongoServerSelectionError: connection timed out at 10.0.1.4:27017');
      internalErr.statusCode = 500;

      let responseStatusCode = null;
      let responseBody = null;

      const mockReq = { originalUrl: '/api/v1/complaints' };
      const mockRes = {
        status(code) {
          responseStatusCode = code;
          return this;
        },
        json(payload) {
          responseBody = payload;
          return this;
        }
      };

      try {
        globalErrorHandler(internalErr, mockReq, mockRes, () => {});

        assert.strictEqual(responseStatusCode, 500);
        assert.strictEqual(responseBody.success, false);
        assert.strictEqual(responseBody.error.message, 'An unexpected internal error occurred. Please contact system administrator.');
        assert.strictEqual(responseBody.error.details, null);
        assert.strictEqual(JSON.stringify(responseBody).includes('MongoServerSelectionError'), false);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});

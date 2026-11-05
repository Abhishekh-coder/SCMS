const { logger } = require('./logger');

function sanitizeSecret(value) {
  if (!value || typeof value !== 'string') return '[EMPTY]';
  return `${value.slice(0, 3)}***${value.slice(-3)} (${value.length} chars)`;
}

function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/i, '$1*****$3');
}

/**
 * Validates active environment variables for production readiness and security.
 * Enforces fail-fast validation on critical secrets in production mode.
 */
function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';
  const errors = [];
  const warnings = [];

  // 1. Critical Database URI
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    if (isProduction) {
      errors.push('MONGO_URI is required in production.');
    } else {
      warnings.push('MONGO_URI not specified. Using development default: mongodb://localhost:27017/ccms_db');
    }
  } else if (isProduction) {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      warnings.push(`MONGO_URI in production points to localhost (${sanitizeMongoUri(uri)}). Verify this is intended.`);
    }
  }

  // 2. JWT Access Secret
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const devAccessPlaceholders = [
    'fallback_access_secret_32chars_long',
    'dev_jwt_access_secret_key_32chars_min_length',
    'dev_access_secret_key_ccms_phase1_local_dev'
  ];
  if (!accessSecret) {
    if (isProduction) {
      errors.push('JWT_ACCESS_SECRET is required in production.');
    } else {
      warnings.push('JWT_ACCESS_SECRET is using development fallback.');
    }
  } else if (isProduction) {
    if (devAccessPlaceholders.includes(accessSecret)) {
      errors.push('JWT_ACCESS_SECRET is set to an insecure development placeholder in production.');
    } else if (accessSecret.length < 32) {
      errors.push(`JWT_ACCESS_SECRET must be at least 32 characters in production (currently ${accessSecret.length}).`);
    }
  }

  // 3. JWT Refresh Secret
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const devRefreshPlaceholders = [
    'fallback_refresh_secret_32chars_long',
    'dev_jwt_refresh_secret_key_32chars_min_length',
    'dev_refresh_secret_key_ccms_phase1_local_dev'
  ];
  if (!refreshSecret) {
    if (isProduction) {
      errors.push('JWT_REFRESH_SECRET is required in production.');
    } else {
      warnings.push('JWT_REFRESH_SECRET is using development fallback.');
    }
  } else if (isProduction) {
    if (devRefreshPlaceholders.includes(refreshSecret)) {
      errors.push('JWT_REFRESH_SECRET is set to an insecure development placeholder in production.');
    } else if (refreshSecret.length < 32) {
      errors.push(`JWT_REFRESH_SECRET must be at least 32 characters in production (currently ${refreshSecret.length}).`);
    }
  }

  // 4. CORS Origins
  if (isProduction && (!process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGINS.includes('localhost'))) {
    warnings.push('CORS_ALLOWED_ORIGINS in production contains localhost or is unset. Restrict to authorized institutional domains.');
  }

  // 5. Fail-Fast or Report
  if (errors.length > 0) {
    logger.error('❌ CRITICAL ENVIRONMENT CONFIGURATION ERROR(S):');
    errors.forEach(err => logger.error(`   - ${err}`));
  }

  if (warnings.length > 0) {
    warnings.forEach(warn => logger.warn(`⚠️ [Env Audit] ${warn}`));
  }

  return { isValid: errors.length === 0, errors, warnings };
}

module.exports = { validateEnvironment, sanitizeMongoUri };

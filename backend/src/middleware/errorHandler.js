const { logger } = require('../config/logger');

function globalErrorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred on CCMS API server.';

  // Mongoose or Application Validation Error Shielding
  if (err.name === 'ValidationError' || errorCode === 'VAL_001' || err.constructor?.name === 'ValidationError') {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    message = err.message || 'Validation failed.';
    logger.warn(`Shielded Validation Error: ${err.message}`, { stack: err.stack });
  } else if (errorCode === 'CONCURRENCY_ERROR') {
    statusCode = 409;
    message = 'Concurrency Conflict: Resource was modified by another operation.';
  }

  if (statusCode >= 500) {
    logger.error('Unhandled Application Error:', err);
  } else if (errorCode === 'AUTH_007' && (err.isExpiredToken || message === 'Access token has expired.')) {
    logger.debug(`ACCESS_TOKEN_EXPIRED → refresh expected (${statusCode}): ${message}`);
  } else {
    logger.warn(`API Error [${errorCode}] (${statusCode}): ${message}`);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const safeMessage = (statusCode >= 500 && isProduction && !err.isOperational)
    ? 'An unexpected internal error occurred. Please contact system administrator.'
    : message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: safeMessage,
      details: (statusCode === 422 || isProduction) ? null : (err.details || null)
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = { globalErrorHandler };

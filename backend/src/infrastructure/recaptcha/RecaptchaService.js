const { logger } = require('../../config/logger');
const { AppError } = require('../../shared/errors/AppError');

class RecaptchaService {
  async verifyToken(token, clientIp) {
    // Bypass reCAPTCHA check if disabled, in dev/test environment, or mock secret mode
    if (!token || process.env.RECAPTCHA_ENABLED === 'false' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || process.env.RECAPTCHA_SECRET_KEY === 'test_recaptcha_secret_key' || !process.env.RECAPTCHA_SECRET_KEY) {
      logger.debug('reCAPTCHA verification bypassed in development/test environment.');
      return { success: true, score: 1.0 };
    }

    try {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      const url = 'https://www.google.com/recaptcha/api/siteverify';
      const params = new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: clientIp || ''
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      const data = await response.json();

      if (!data.success || (data.score !== undefined && data.score < 0.5)) {
        logger.warn(`reCAPTCHA verification failed. Score: ${data.score}, Error Codes: ${JSON.stringify(data['error-codes'])}`);
        throw new AppError('reCAPTCHA security verification failed. Low trust score.', 400, 'AUTH_010');
      }

      return { success: true, score: data.score || 1.0 };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error contacting reCAPTCHA service:', error.message);
      if (process.env.NODE_ENV === 'development') {
        return { success: true, score: 0.9 };
      }
      throw new AppError('reCAPTCHA verification service unavailable.', 500, 'AUTH_010');
    }
  }
}

module.exports = new RecaptchaService();

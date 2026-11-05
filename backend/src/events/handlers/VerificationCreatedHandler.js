/**
 * CCMS — VerificationCreatedHandler
 *
 * Listens for VERIFICATION_CREATED domain events and dispatches notifications via NotificationDispatcher.
 */

const { logger } = require('../../config/logger');
const notificationDispatcher = require('../../domains/notifications/NotificationDispatcher');

class VerificationCreatedHandler {
  async handle(event) {
    const payload = event?.payload || event || {};
    const { traceId, email, channel, rawCode, magicLinkUrl, purpose, tenantId, campusId } = payload;
    
    const logOtp = process.env.NODE_ENV === 'production' ? '[REDACTED]' : (rawCode || 'N/A');
    logger.info(`📍 [TRACE: ${traceId || 'N/A'}] 📩 [VerificationCreatedHandler] Processing ${purpose || 'REGISTER'} verification for email: ${email} (OTP: ${logOtp})`);

    try {
      await notificationDispatcher.sendVerification({
        traceId,
        channel: channel || 'EMAIL',
        recipient: email,
        purpose: purpose || 'REGISTER',
        challengeData: {
          rawCode,
          magicLinkUrl,
        },
        tenantId,
        campusId,
      });
    } catch (err) {
      logger.error(`❌ [VerificationCreatedHandler] Failed to dispatch verification for ${email}:`, err);
    }
  }
}

module.exports = new VerificationCreatedHandler();

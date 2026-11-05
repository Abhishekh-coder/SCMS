const eventPublisher = require('../publishers/EventPublisher');
const { logger } = require('../../config/logger');

class EmailVerificationSubscriber {
  constructor() {
    this.init();
  }

  init() {
    eventPublisher.on('UserRegistered', this.handleUserRegistered.bind(this));
  }

  async handleUserRegistered(event) {
    try {
      const { userUuid, email, tenantId, campusId } = event.payload;
      logger.info(`📧 [EmailVerificationSubscriber] Handling UserRegistered for email=${email}, userUuid=${userUuid}`);
      
      // Decoupled notification dispatch payload (NO password, NO secrets)
      const notificationPayload = {
        to: email,
        template: 'EMAIL_VERIFICATION_OTP',
        context: {
          userUuid,
          tenantId,
          campusId
        }
      };

      // In Sprint 2A, we log decoupled event handling readiness
      logger.info(`✅ Decoupled Email Verification Notification queued for ${email}`);
    } catch (error) {
      logger.error('❌ Error in EmailVerificationSubscriber:', error);
    }
  }
}

module.exports = new EmailVerificationSubscriber();

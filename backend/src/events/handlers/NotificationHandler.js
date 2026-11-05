/**
 * CCMS — NotificationHandler
 *
 * Generic notification event handler.
 */

const { logger } = require('../../config/logger');

class NotificationHandler {
  async handle(event) {
    const payload = event?.payload || event || {};
    const eventType = event?.eventType || payload.eventType || 'USER_REGISTERED';
    logger.info(`📥 [NotificationHandler] Event received: [${eventType}]`, {
      userUuid: payload.userUuid,
      email: payload.email
    });
  }
}

module.exports = new NotificationHandler();

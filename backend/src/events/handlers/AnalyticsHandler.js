/**
 * CCMS — AnalyticsHandler
 *
 * Listens to domain events to update analytics metrics.
 */

const { logger } = require('../../config/logger');

class AnalyticsHandler {
  async handle(event) {
    const payload = event?.payload || event || {};
    const eventType = event?.eventType || payload.eventType || 'ACCOUNT_ACTIVATED';
    logger.info(`📊 [AnalyticsHandler] Processed event: [${eventType}]`, {
      userUuid: payload.userUuid,
      email: payload.email
    });
  }
}

module.exports = new AnalyticsHandler();

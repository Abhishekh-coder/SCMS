/**
 * CCMS — Notification Dispatcher
 *
 * Channel-agnostic notification dispatcher routing payloads to EmailChannel (or future SMS/WhatsApp channels).
 */

const { logger } = require('../../config/logger');
const emailChannel = require('./channels/EmailChannel');

class NotificationDispatcher {
  constructor() {
    this.channels = new Map();
    this.channels.set('EMAIL', emailChannel);
  }

  async sendVerification({ traceId, channel = 'EMAIL', recipient, purpose = 'REGISTER', challengeData, tenantId, campusId }) {
    const channelProvider = this.channels.get(channel.toUpperCase());
    if (!channelProvider) {
      logger.warn(`[TRACE: ${traceId || 'N/A'}] Notification channel '${channel}' not registered. Defaulting to EMAIL.`);
      return await emailChannel.send({ traceId, recipient, purpose, challengeData });
    }

    return await channelProvider.send({ traceId, recipient, purpose, challengeData });
  }
}

module.exports = new NotificationDispatcher();

const { logger } = require('../../config/logger');

class EmailProvider {
  async sendNotification({ to, subject, body }) {
    logger.info(`📧 [EmailProvider] Sending Email to ${to} | Subject: ${subject}`);
    return { success: true, provider: 'EmailProvider', messageId: `msg_${Date.now()}` };
  }
}

class WhatsAppProvider {
  async sendNotification({ to, subject, body }) {
    logger.info(`💬 [WhatsAppProvider] Sending WhatsApp message to ${to}`);
    return { success: true, provider: 'WhatsAppProvider' };
  }
}

class NotificationService {
  constructor() {
    this.providers = {
      email: new EmailProvider(),
      whatsapp: new WhatsAppProvider()
    };
  }

  async dispatchNotification(channel, payload) {
    const provider = this.providers[channel] || this.providers.email;
    return await provider.sendNotification(payload);
  }
}

module.exports = new NotificationService();

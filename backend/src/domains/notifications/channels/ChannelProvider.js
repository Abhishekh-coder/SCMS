const { logger } = require('../../../config/logger');

class BaseChannelProvider {
  async send(user, notification) {
    throw new Error('BaseChannelProvider.send must be implemented by subclass.');
  }
}

class InAppChannelProvider extends BaseChannelProvider {
  async send(user, notification) {
    logger.info(`📱 [InAppChannelProvider] Dispatched live in-app badge to user: ${user.userUuid}`);
    return { success: true, providerResponse: { transport: 'IN_APP_SOCKET', deliveredAt: new Date() } };
  }
}

class EmailChannelProvider extends BaseChannelProvider {
  async send(user, notification) {
    logger.info(`📧 [EmailChannelProvider] Dispatched email to: ${user.email || 'user@campus.edu'}`);
    return { success: true, providerResponse: { transport: 'SMTP', messageId: `msg_${Date.now()}` } };
  }
}

module.exports = {
  BaseChannelProvider,
  InAppChannelProvider: new InAppChannelProvider(),
  EmailChannelProvider: new EmailChannelProvider()
};

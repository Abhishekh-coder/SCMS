/**
 * CCMS — AccountActivatedHandler
 *
 * Listens for ACCOUNT_ACTIVATED domain events to perform post-activation tasks (e.g. welcome notifications).
 */

const { logger } = require('../../config/logger');

class AccountActivatedHandler {
  async handle(event) {
    const payload = event?.payload || event || {};
    const { userUuid, email, tenantId, campusId } = payload;
    logger.info(`🎉 [AccountActivatedHandler] User account activated for ${userUuid} (${email}) [Tenant: ${tenantId}, Campus: ${campusId}]`);
  }
}

module.exports = new AccountActivatedHandler();

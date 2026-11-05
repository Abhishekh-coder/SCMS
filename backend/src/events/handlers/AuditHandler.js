/**
 * CCMS — AuditHandler
 *
 * Listens to domain events and persists immutable security audit log entries.
 */

const { logger } = require('../../config/logger');
const auditService = require('../../domains/audit/audit.service');

class AuditHandler {
  async handle(event) {
    try {
      const payload = event?.payload || event || {};
      const { userUuid, loginId, ipAddress, userAgent } = payload;
      auditService.recordEvent({
        eventType: event?.eventType || 'DOMAIN_EVENT',
        userUuid: userUuid || null,
        loginId: loginId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: payload
      });
    } catch (err) {
      logger.error('Failed to log audit event in AuditHandler:', err);
    }
  }
}

module.exports = new AuditHandler();

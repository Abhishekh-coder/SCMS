const { logger } = require('../../config/logger');

class AuditService {
  constructor() {
    this.logs = [];
  }

  recordEvent({ eventType, userId, userUuid, ipAddress, userAgent, details }) {
    const entry = {
      eventId: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      eventType,
      userId,
      userUuid,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'System',
      details: details || {},
      timestamp: new Date()
    };

    this.logs.push(entry);
    logger.info(`📋 [Security Audit Log] Event: [${eventType}] | UserUuid: ${userUuid || 'N/A'}`);
    return entry;
  }

  getAuditLogs(userUuid) {
    if (!userUuid) return this.logs;
    return this.logs.filter(l => l.userUuid === userUuid);
  }
}

module.exports = new AuditService();

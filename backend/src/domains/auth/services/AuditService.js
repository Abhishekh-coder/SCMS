const mongoose = require('mongoose');
const { AuditLogSchema } = require('../../../../../database/schema/schemas');

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

class AuditService {
  async logSecurityEvent(eventType, user = null, ipAddress = null, userAgent = null, details = {}, session = null) {
    const auditDoc = new AuditLog({
      eventType,
      userId: user ? user._id.toString() : null,
      userUuid: user ? user.userUuid : null,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'Unknown Client',
      details,
      timestamp: new Date()
    });

    return await auditDoc.save({ session });
  }
}

module.exports = new AuditService();

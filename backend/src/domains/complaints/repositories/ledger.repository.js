const crypto = require('crypto');
const mongoose = require('mongoose');
const { ComplaintEventLedgerSchema } = require('../../../../../database/schema/complaintSchemas');

const ComplaintEventLedger = mongoose.models.ComplaintEventLedger || mongoose.model('ComplaintEventLedger', ComplaintEventLedgerSchema);

class LedgerRepository {
  async recordEvent(eventData, session = null) {
    const {
      complaintId,
      complaintUuid,
      eventType,
      actorUuid,
      actorName,
      previousState = null,
      newState = null,
      note = '',
      metadata = {}
    } = eventData;

    const ledgerDoc = new ComplaintEventLedger({
      ledgerUuid: crypto.randomUUID(),
      complaintId,
      complaintUuid,
      eventType,
      actorUuid,
      actorName,
      previousState,
      newState,
      note,
      metadata,
      timestamp: new Date()
    });

    return await ledgerDoc.save({ session });
  }

  async findByComplaintUuid(complaintUuid, session = null) {
    return await ComplaintEventLedger.find({ complaintUuid }).sort({ timestamp: 1 }).session(session);
  }
}

module.exports = new LedgerRepository();

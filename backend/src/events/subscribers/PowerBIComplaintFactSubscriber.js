const mongoose = require('mongoose');
const eventPublisher = require('../publishers/EventPublisher');
const { logger } = require('../../config/logger');

const reportingComplaintFactSchema = new mongoose.Schema({
  dateKey: { type: Number, required: true, index: true },
  complaintUuid: { type: String, required: true, index: true },
  complaintCode: { type: String, required: true },
  userUuid: { type: String, required: true, index: true },
  departmentCode: { type: String, required: true, index: true },
  priority: { type: String, required: true },
  status: { type: String, required: true },
  slaBreached: { type: Boolean, default: false }
}, { timestamps: true, collection: 'reportingComplaintFacts' });

const ReportingComplaintFact = mongoose.models.ReportingComplaintFact || mongoose.model('ReportingComplaintFact', reportingComplaintFactSchema);

class PowerBIComplaintFactSubscriber {
  constructor() {
    this.init();
  }

  init() {
    eventPublisher.on('ComplaintSubmitted', this.handleComplaintSubmitted.bind(this));
    eventPublisher.on('ComplaintResolved', this.handleComplaintResolved.bind(this));
  }

  getDateKey(date = new Date()) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return parseInt(`${yyyy}${mm}${dd}`, 10);
  }

  async handleComplaintSubmitted(event) {
    try {
      const { complaintUuid, complaintCode, userUuid, departmentCode, priority } = event.payload;
      const dateKey = this.getDateKey(new Date(event.timestamp || Date.now()));

      const fact = new ReportingComplaintFact({
        dateKey,
        complaintUuid,
        complaintCode,
        userUuid,
        departmentCode,
        priority,
        status: 'SUBMITTED',
        slaBreached: false
      });

      await fact.save();
      logger.info(`📊 [PowerBI Ingestion] Logged ReportingComplaintFact for ${complaintCode}`);
    } catch (error) {
      logger.error('❌ Error in PowerBIComplaintFactSubscriber:', error);
    }
  }

  async handleComplaintResolved(event) {
    try {
      const { complaintUuid, complaintCode } = event.payload;
      await ReportingComplaintFact.updateOne(
        { complaintUuid },
        { $set: { status: 'RESOLVED' } }
      );
      logger.info(`📊 [PowerBI Ingestion] Updated ReportingComplaintFact to RESOLVED for ${complaintCode}`);
    } catch (error) {
      logger.error('❌ Error in PowerBIComplaintFactSubscriber (Resolved):', error);
    }
  }
}

module.exports = new PowerBIComplaintFactSubscriber();

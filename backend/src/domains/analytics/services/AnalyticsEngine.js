const mongoose = require('mongoose');
const eventPublisher = require('../../../events/publishers/EventPublisher');
const {
  ReportingComplaintFactSchema,
  ReportingSlaFactSchema,
  ReportingNotificationFactSchema
} = require('../../../../../database/schema/analyticsSchemas');
const { logger } = require('../../../config/logger');

const ReportingComplaintFact = mongoose.models.ReportingComplaintFact || mongoose.model('ReportingComplaintFact', ReportingComplaintFactSchema);
const ReportingSlaFact = mongoose.models.ReportingSlaFact || mongoose.model('ReportingSlaFact', ReportingSlaFactSchema);
const ReportingNotificationFact = mongoose.models.ReportingNotificationFact || mongoose.model('ReportingNotificationFact', ReportingNotificationFactSchema);

class AnalyticsEngine {
  constructor() {
    this.initListeners();
  }

  getDateKey(date = new Date()) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return parseInt(`${yyyy}${mm}${dd}`, 10);
  }

  initListeners() {
    eventPublisher.on('ComplaintSubmitted', (evt) => this.handleComplaintSubmitted(evt.payload));
    eventPublisher.on('ComplaintResolved', (evt) => this.handleComplaintResolved(evt.payload));
    eventPublisher.on('NotificationSent', (evt) => this.handleNotificationSent(evt.payload));
  }

  async handleComplaintSubmitted(payload) {
    try {
      if (mongoose.connection.readyState === 0) return;
      const { complaintUuid, complaintCode, userUuid, departmentCode, categoryCode, priority } = payload;
      const dateKey = this.getDateKey();

      await ReportingComplaintFact.updateOne(
        { complaintUuid },
        {
          $setOnInsert: {
            tenantId: 'tenant_campus_01',
            campusId: 'main_campus',
            dateKey,
            complaintUuid,
            complaintCode,
            userUuid,
            departmentCode,
            categoryCode: categoryCode || 'GENERAL',
            priority,
            status: 'SUBMITTED',
            resolutionDurationHours: null,
            slaBreached: false
          }
        },
        { upsert: true }
      );

      logger.info(`📊 [AnalyticsEngine] Ingested ComplaintSubmitted Fact for ${complaintCode}`);
    } catch (error) {
      logger.error('❌ Error in AnalyticsEngine ComplaintSubmitted:', error);
    }
  }

  async handleComplaintResolved(payload) {
    try {
      if (mongoose.connection.readyState === 0) return;
      const { complaintUuid, occurredAt } = payload;

      const fact = await ReportingComplaintFact.findOne({ complaintUuid });
      if (fact) {
        const submissionTime = fact.createdAt ? fact.createdAt.getTime() : Date.now() - 3600000;
        const resolutionTime = new Date(occurredAt || Date.now()).getTime();
        const durationHours = parseFloat(((resolutionTime - submissionTime) / (1000 * 60 * 60)).toFixed(2));

        fact.status = 'RESOLVED';
        fact.resolutionDurationHours = durationHours;
        await fact.save();

        logger.info(`📊 [AnalyticsEngine] Updated ComplaintResolved Fact for ${complaintUuid} (${durationHours}h)`);
      }
    } catch (error) {
      logger.error('❌ Error in AnalyticsEngine ComplaintResolved:', error);
    }
  }

  async handleNotificationSent(payload) {
    try {
      if (mongoose.connection.readyState === 0) return;
      const { notificationUuid, userUuid, channel, priority, status } = payload;
      const dateKey = this.getDateKey();

      const fact = new ReportingNotificationFact({
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
        dateKey,
        notificationUuid,
        userUuid,
        channel,
        priority,
        status
      });

      await fact.save();
      logger.info(`📊 [AnalyticsEngine] Ingested NotificationSent Fact for ${notificationUuid}`);
    } catch (error) {
      logger.error('❌ Error in AnalyticsEngine NotificationSent:', error);
    }
  }
}

module.exports = new AnalyticsEngine();

const crypto = require('crypto');
const mongoose = require('mongoose');
const templateEngine = require('../services/TemplateEngine');
const notificationQueue = require('../queue/NotificationQueue');
const eventPublisher = require('../../../events/publishers/EventPublisher');
const {
  NotificationSchema,
  NotificationPreferenceSchema
} = require('../../../../../database/schema/notificationSchemas');
const { UserSchema } = require('../../../../../database/schema/schemas');
const { logger } = require('../../../config/logger');

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const NotificationPreference = mongoose.models.NotificationPreference || mongoose.model('NotificationPreference', NotificationPreferenceSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

class NotificationOrchestrator {
  constructor() {
    this.initListeners();
  }

  initListeners() {
    eventPublisher.on('ComplaintSubmitted', (evt) => this.handleComplaintSubmitted(evt.payload));
    eventPublisher.on('ComplaintResolved', (evt) => this.handleComplaintResolved(evt.payload));
  }

  async dispatchNotification(targetUserUuid, title, body, type = 'INFO', priority = 'NORMAL', actionUrl = null) {
    try {
      const user = await User.findOne({ userUuid: targetUserUuid, isDeleted: false });
      if (!user) return null;

      // Check User Preferences
      const pref = await NotificationPreference.findOne({ userUuid: targetUserUuid });
      if (pref && !pref.inAppNotifications) {
        logger.info(`🚫 Notification skipped for ${targetUserUuid} (User Opted Out)`);
        return null;
      }

      const notificationUuid = crypto.randomUUID();
      
      // 1. Create Notification Record with State Machine CREATED
      const notificationDoc = new Notification({
        tenantId: user.tenantId || 'tenant_campus_01',
        campusId: user.campusId || 'main_campus',
        notificationUuid,
        userUuid: user.userUuid,
        title,
        body,
        type,
        priority,
        status: 'CREATED',
        readAt: null,
        actionUrl
      });

      const saved = await notificationDoc.save();

      // 2. State Transition: CREATED -> QUEUED
      saved.status = 'QUEUED';
      await saved.save();

      // 3. Enqueue Job for Asynchronous Multi-Channel Delivery
      notificationQueue.enqueue({
        notificationUuid: saved.notificationUuid,
        user: { userUuid: user.userUuid, fullName: user.fullName, email: user.email },
        notification: saved,
        channel: 'IN_APP'
      });

      // 4. Emit NotificationSent event for Power BI analytics ingestion
      await eventPublisher.publish('NotificationSent', {
        notificationUuid,
        userUuid: user.userUuid,
        channel: 'IN_APP',
        priority,
        status: 'QUEUED',
        occurredAt: new Date().toISOString()
      });

      return saved;
    } catch (error) {
      logger.error('❌ Error dispatching notification:', error);
      return null;
    }
  }

  async handleComplaintSubmitted(payload) {
    const { complaintUuid, complaintCode, userUuid, priority } = payload;
    const notifPriority = priority === 'CRITICAL' || priority === 'HIGH' ? 'HIGH' : 'NORMAL';
    const title = `Complaint Submitted: ${complaintCode}`;
    const body = `Your complaint ${complaintCode} (${priority} priority) has been received and assigned.`;
    await this.dispatchNotification(userUuid, title, body, 'INFO', notifPriority, `/complaints/${complaintUuid}`);
  }

  async handleComplaintResolved(payload) {
    const { complaintUuid, complaintCode, actorUuid } = payload;
    const title = `Complaint Resolved: ${complaintCode}`;
    const body = `Your complaint ${complaintCode} has been marked as RESOLVED. Please review and confirm closure.`;
    await this.dispatchNotification(actorUuid, title, body, 'SUCCESS', 'NORMAL', `/complaints/${complaintUuid}`);
  }
}

module.exports = new NotificationOrchestrator();

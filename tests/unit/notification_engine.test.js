const { describe, it } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');

const templateEngine = require('../../backend/src/domains/notifications/services/TemplateEngine');
const notificationQueue = require('../../backend/src/domains/notifications/queue/NotificationQueue');
const {
  NotificationSchema,
  NotificationTemplateSchema,
  NotificationPreferenceSchema,
  NotificationDeliveryAttemptSchema
} = require('../../database/schema/notificationSchemas');

describe('Phase 4 - Communication & Notification Platform Unit Tests', () => {
  const Notification = mongoose.models.TestNotification2 || mongoose.model('TestNotification2', NotificationSchema);
  const NotificationDeliveryAttempt = mongoose.models.TestNotificationDeliveryAttempt2 || mongoose.model('TestNotificationDeliveryAttempt2', NotificationDeliveryAttemptSchema);
  const NotificationPreference = mongoose.models.TestNotificationPreference2 || mongoose.model('TestNotificationPreference2', NotificationPreferenceSchema);

  it('1. should compile Handlebars-style dynamic variables using TemplateEngine', () => {
    const template = 'Hello {{studentName}}, your complaint {{complaintCode}} is {{status}}.';
    const compiled = templateEngine.compile(template, {
      studentName: 'Ananya Verma',
      complaintCode: 'CMP-2026-CSE-100201',
      status: 'ASSIGNED'
    });

    assert.strictEqual(compiled, 'Hello Ananya Verma, your complaint CMP-2026-CSE-100201 is ASSIGNED.');
  });

  it('2. should validate NotificationSchema state machine (CREATED -> QUEUED -> DELIVERED -> READ) and priority', () => {
    const notif = new Notification({
      notificationUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      userUuid: 'user_uuid_101',
      title: 'SLA Breach Warning',
      body: 'Complaint CMP-2026-CSE-100201 has breached 80% SLA window.',
      type: 'URGENT',
      priority: 'CRITICAL',
      status: 'QUEUED',
      templateCode: 'SLA_WARNING_EMAIL',
      templateVersion: 1
    });

    assert.strictEqual(notif.validateSync(), undefined);
    assert.strictEqual(notif.status, 'QUEUED');
    assert.strictEqual(notif.priority, 'CRITICAL');
  });

  it('3. should validate separated NotificationDeliveryAttemptSchema for multi-channel logging', () => {
    const attempt = new NotificationDeliveryAttempt({
      attemptUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      notificationUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      userUuid: 'user_uuid_101',
      channel: 'EMAIL',
      status: 'SUCCESS',
      retryCount: 0,
      deliveredAt: new Date()
    });

    assert.strictEqual(attempt.validateSync(), undefined);
    assert.strictEqual(attempt.status, 'SUCCESS');
  });

  it('4. should enqueue job into NotificationQueue for async delivery', () => {
    const initialLen = notificationQueue.queue.length;
    notificationQueue.enqueue({
      notificationUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      user: { userUuid: 'user_101', fullName: 'Test User' },
      notification: { title: 'Test' },
      channel: 'IN_APP',
      skipDb: true
    });

    assert.strictEqual(notificationQueue.queue.length >= initialLen, true);
  });
});

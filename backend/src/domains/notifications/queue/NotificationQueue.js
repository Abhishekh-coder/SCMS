const crypto = require('crypto');
const mongoose = require('mongoose');
const { InAppChannelProvider, EmailChannelProvider } = require('../channels/ChannelProvider');
const { NotificationDeliveryAttemptSchema, NotificationSchema } = require('../../../../../database/schema/notificationSchemas');
const { logger } = require('../../../config/logger');

const NotificationDeliveryAttempt = mongoose.models.NotificationDeliveryAttempt || mongoose.model('NotificationDeliveryAttempt', NotificationDeliveryAttemptSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

class NotificationQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
  }

  enqueue(job) {
    this.queue.push(job);
    logger.info(`📥 [NotificationQueue] Enqueued job: ${job.notificationUuid} (${job.channel})`);
    setImmediate(() => this.processNext());
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      let provider = InAppChannelProvider;
      if (job.channel === 'EMAIL') provider = EmailChannelProvider;

      const result = await provider.send(job.user, job.notification);

      // Record Delivery Attempt
      if (!job.skipDb) {
        const attemptDoc = new NotificationDeliveryAttempt({
          attemptUuid: crypto.randomUUID(),
          notificationUuid: job.notificationUuid,
          userUuid: job.user.userUuid,
          channel: job.channel,
          status: result.success ? 'SUCCESS' : 'FAILED',
          retryCount: job.retryCount || 0,
          deliveredAt: result.success ? new Date() : null
        });

        await attemptDoc.save();

        if (result.success) {
          await Notification.updateOne(
            { notificationUuid: job.notificationUuid },
            { $set: { status: 'DELIVERED' } }
          );
        }
      }
    } catch (error) {
      logger.error(`❌ [NotificationQueue] Error processing notification ${job.notificationUuid}:`, error.message);
      if ((job.retryCount || 0) < this.maxRetries) {
        job.retryCount = (job.retryCount || 0) + 1;
        this.queue.push(job);
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) setImmediate(() => this.processNext());
    }
  }
}

module.exports = new NotificationQueue();

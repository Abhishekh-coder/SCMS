/**
 * CCMS — Outbox Processor (Implementing IOutboxProcessor)
 *
 * Polling/triggered worker processing PENDING OutboxMessage items post-commit.
 */

const { OutboxMessage } = require('../../domains/auth/models/OutboxMessage');
const { eventBus } = require('../../events/eventBus');
const verificationCreatedHandler = require('../../events/handlers/VerificationCreatedHandler');
const accountActivatedHandler = require('../../events/handlers/AccountActivatedHandler');
const notificationHandler = require('../../events/handlers/NotificationHandler');
const auditHandler = require('../../events/handlers/AuditHandler');
const analyticsHandler = require('../../events/handlers/AnalyticsHandler');
const { logger } = require('../../config/logger');

let isHandlersRegistered = false;

class MongoOutboxProcessor {
  constructor() {
    this.registerHandlers();
  }

  registerHandlers() {
    if (isHandlersRegistered) return;
    isHandlersRegistered = true;

    eventBus.subscribe('VERIFICATION_CREATED', (evt) => verificationCreatedHandler.handle(evt));
    eventBus.subscribe('ACCOUNT_ACTIVATED', (evt) => accountActivatedHandler.handle(evt));
    eventBus.subscribe('USER_REGISTERED', (evt) => notificationHandler.handle(evt));
    eventBus.subscribe('USER_REGISTERED', (evt) => auditHandler.handle(evt));
    eventBus.subscribe('ACCOUNT_ACTIVATED', (evt) => auditHandler.handle(evt));
    eventBus.subscribe('ACCOUNT_ACTIVATED', (evt) => analyticsHandler.handle(evt));
  }

  async processPendingEvents(batchSize = 20) {
    try {
      const messages = await OutboxMessage.find({ status: 'PENDING' })
        .sort({ createdAt: 1 })
        .limit(batchSize);

      for (const msg of messages) {
        try {
          logger.info(`📤 [OutboxProcessor] Dispatching message ${msg.messageId} (Type: ${msg.eventType})`, {
            payload: msg.payload
          });
          eventBus.publish(msg.eventType, msg.payload);
          msg.status = 'PROCESSED';
          msg.processedAt = new Date();
          await msg.save();
        } catch (err) {
          msg.retryCount += 1;
          if (msg.retryCount >= 3) {
            msg.status = 'FAILED';
          }
          msg.error = err.message;
          await msg.save();
          logger.error(`Outbox processing failed for message ${msg.messageId}:`, err);
        }
      }
    } catch (err) {
      logger.error('Error during OutboxProcessor execution:', err);
    }
  }
}

module.exports = new MongoOutboxProcessor();

/**
 * CCMS — Transactional Outbox Model
 *
 * Atomically created within MongoDB transactions alongside User & VerificationSession records.
 * Polled/processed post-commit by OutboxProcessor to publish domain events cleanly.
 */

const mongoose = require('mongoose');

const outboxMessageSchema = new mongoose.Schema({
  messageId: {
    type:     String,
    required: true,
    unique:   true,
    index:    true,
    default:  () => `outbox_${crypto.randomUUID()}`
  },
  eventType: {
    type:     String,
    required: true,
    index:    true
  },
  payload: {
    type:     mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type:     String,
    required: true,
    enum:     ['PENDING', 'PROCESSED', 'FAILED'],
    default:  'PENDING',
    index:    true
  },
  retryCount: {
    type:    Number,
    default: 0
  },
  processedAt: {
    type:    Date,
    default: null
  },
  error: {
    type:    String,
    default: null
  }
}, { timestamps: true, collection: 'outboxMessages' });

outboxMessageSchema.index({ status: 1, createdAt: 1 });

const OutboxMessage = mongoose.models.OutboxMessage || mongoose.model('OutboxMessage', outboxMessageSchema);

module.exports = {
  OutboxMessageSchema: outboxMessageSchema,
  OutboxMessage,
};

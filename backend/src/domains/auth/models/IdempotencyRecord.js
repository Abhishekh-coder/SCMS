/**
 * CCMS — Idempotency Key Record Model
 *
 * Scoped by tenantId, campusId, loginId, endpoint, and idempotencyKey.
 * Prevents duplicate requests (e.g. double-click on register) across distributed nodes.
 */

const mongoose = require('mongoose');

const idempotencyRecordSchema = new mongoose.Schema({
  idempotencyKey: {
    type:     String,
    required: true,
    index:    true
  },
  tenantId: {
    type:     String,
    required: true,
    default:  'tenant_campus_01'
  },
  campusId: {
    type:     String,
    required: true,
    default:  'main_campus'
  },
  loginId: {
    type:     String,
    uppercase: true,
    trim:     true
  },
  endpoint: {
    type:     String,
    required: true
  },
  requestHash: {
    type:     String,
    required: true
  },
  responseBody: {
    type:     mongoose.Schema.Types.Mixed,
    default:  null
  },
  statusCode: {
    type:     Number,
    default:  null
  },
  expiresAt: {
    type:     Date,
    required: true,
    index:    true
  }
}, { timestamps: true, collection: 'idempotencyRecords' });

idempotencyRecordSchema.index({ tenantId: 1, campusId: 1, endpoint: 1, idempotencyKey: 1 }, { unique: true });

const IdempotencyRecord = mongoose.models.IdempotencyRecord || mongoose.model('IdempotencyRecord', idempotencyRecordSchema);

module.exports = {
  IdempotencyRecordSchema: idempotencyRecordSchema,
  IdempotencyRecord,
};

/**
 * CCMS — Transport-Agnostic Verification Session Model
 *
 * Tracks verification session metadata for REGISTER, PASSWORD_RESET, EMAIL_CHANGE, and MFA.
 */

const mongoose = require('mongoose');

const verificationSessionSchema = new mongoose.Schema({
  sessionId: {
    type:     String,
    required: true,
    unique:   true,
    index:    true,
    default:  () => `ver_sess_${crypto.randomUUID()}`
  },
  tenantId: {
    type:     String,
    required: true,
    index:    true,
    default:  'tenant_campus_01'
  },
  campusId: {
    type:     String,
    required: true,
    index:    true,
    default:  'main_campus'
  },
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true
  },
  userUuid: {
    type:     String,
    required: true,
    index:    true
  },
  loginId: {
    type:     String,
    uppercase: true,
    trim:     true,
    index:    true
  },
  email: {
    type:      String,
    required:  true,
    lowercase: true,
    trim:      true,
    index:     true
  },
  purpose: {
    type:     String,
    required: true,
    enum:     ['REGISTER', 'PASSWORD_RESET', 'EMAIL_CHANGE', 'MFA'],
    default:  'REGISTER',
    index:    true
  },
  channel: {
    type:     String,
    required: true,
    enum:     ['EMAIL', 'SMS', 'WHATSAPP'],
    default:  'EMAIL'
  },
  version: {
    type:     Number,
    required: true,
    default:  1
  },
  status: {
    type:     String,
    required: true,
    enum:     ['PENDING', 'VERIFIED', 'EXPIRED', 'FAILED', 'SUPERSEDED'],
    default:  'PENDING',
    index:    true
  },
  lastSentAt: {
    type:    Date,
    default: Date.now
  },
  resendCount: {
    type:    Number,
    default: 0
  },
  ipAddress: {
    type:    String,
    default: null
  },
  userAgent: {
    type:    String,
    default: null
  },
  deviceFingerprint: {
    type:    String,
    default: null
  },
  verifiedAt: {
    type:    Date,
    default: null
  }
}, { timestamps: true, collection: 'verificationSessions' });

verificationSessionSchema.index({ tenantId: 1, campusId: 1, email: 1, purpose: 1, status: 1 });
verificationSessionSchema.index({ userUuid: 1, purpose: 1, version: -1 });

const VerificationSession = mongoose.models.VerificationSession || mongoose.model('VerificationSession', verificationSessionSchema);

module.exports = {
  VerificationSessionSchema: verificationSessionSchema,
  VerificationSession,
};

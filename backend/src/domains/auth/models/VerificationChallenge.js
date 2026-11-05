/**
 * CCMS — Verification Challenge Model
 *
 * Decouples challenge credentials (OTP, Magic Link, WebAuthn) from VerificationSession metadata.
 */

const mongoose = require('mongoose');

const verificationChallengeSchema = new mongoose.Schema({
  challengeId: {
    type:     String,
    required: true,
    unique:   true,
    index:    true,
    default:  () => `chl_${crypto.randomUUID()}`
  },
  sessionId: {
    type:     String,
    required: true,
    index:    true
  },
  challengeType: {
    type:     String,
    required: true,
    enum:     ['OTP', 'MAGIC_LINK', 'WEBAUTHN'],
    default:  'OTP',
    index:    true
  },
  challengeHash: {
    type:     String,
    required: true
  },
  expiresAt: {
    type:     Date,
    required: true,
    index:    true
  },
  attempts: {
    type:     Number,
    required: true,
    default:  0
  },
  maxAttempts: {
    type:     Number,
    required: true,
    default:  5
  }
}, { timestamps: true, collection: 'verificationChallenges' });

verificationChallengeSchema.index({ sessionId: 1, challengeType: 1 });

const VerificationChallenge = mongoose.models.VerificationChallenge || mongoose.model('VerificationChallenge', verificationChallengeSchema);

module.exports = {
  VerificationChallengeSchema: verificationChallengeSchema,
  VerificationChallenge,
};

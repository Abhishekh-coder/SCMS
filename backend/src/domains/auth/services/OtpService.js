/**
 * CCMS — Verification & OTP Service
 *
 * Implements verification challenge checking, 60s resend cooldowns, 5/hr rate limits,
 * unverified email updates, and delegates account activation to AccountService.activateAccount().
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const { UserSchema } = require('../../../../../database/schema/schemas');
const { VerificationSession } = require('../models/VerificationSession');
const { VerificationChallenge } = require('../models/VerificationChallenge');
const { OutboxMessage } = require('../models/OutboxMessage');
const verificationProviderFactory = require('../providers/VerificationProviderFactory');
const accountService = require('./AccountService');
const mongoOutboxProcessor = require('../../../infrastructure/outbox/MongoOutboxProcessor');
const { AppError, ValidationError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../config/logger');
const bcrypt = require('bcryptjs');

const User = mongoose.models.User || mongoose.model('User', UserSchema);

class OtpService {
  /**
   * Verify an OTP or Magic Link challenge.
   */
  async verifyEmailOtp({ email, otpCode, verificationToken, tenantId = 'tenant_campus_01', campusId = 'main_campus' }) {
    const submittedValue = otpCode || verificationToken;
    if (!email || !submittedValue) {
      throw new ValidationError('Email address and verification code or token are required.', 'VAL_001');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ tenantId, email: normalizedEmail, isDeleted: false });
    if (!user) {
      throw new AppError('No account found matching this email address.', 404, 'USER_NOT_FOUND');
    }

    if (user.accountStatus === 'ACTIVE') {
      return {
        alreadyActivated: true,
        userUuid: user.userUuid,
        email: user.email,
        accountStatus: 'ACTIVE',
        message: 'Account is already active. Please sign in.'
      };
    }

    // Find latest PENDING VerificationSession for user
    const sessionDoc = await VerificationSession.findOne({
      tenantId,
      userUuid: user.userUuid,
      status: 'PENDING'
    }).sort({ createdAt: -1 });

    if (!sessionDoc) {
      throw new AppError('No pending verification session found. Please request a new verification code.', 400, 'AUTH_006');
    }

    const challengeType = otpCode ? 'OTP' : 'MAGIC_LINK';
    const challengeDoc = await VerificationChallenge.findOne({
      sessionId: sessionDoc.sessionId,
      challengeType
    });

    if (!challengeDoc) {
      throw new AppError('Verification challenge record not found. Please request a new code.', 400, 'AUTH_006');
    }

    // Check expiration (10 minutes)
    if (challengeDoc.expiresAt < new Date()) {
      sessionDoc.status = 'EXPIRED';
      await sessionDoc.save();
      throw new AppError('Verification code has expired. Please request a new code.', 400, 'AUTH_006');
    }

    // Verify hash via VerificationProviderFactory
    const provider = verificationProviderFactory.getProvider(challengeType);
    const isValid = provider.verifyChallenge(submittedValue, challengeDoc.challengeHash);

    if (!isValid) {
      challengeDoc.attempts += 1;
      await challengeDoc.save();

      if (challengeDoc.attempts >= challengeDoc.maxAttempts) {
        sessionDoc.status = 'FAILED';
        await sessionDoc.save();
        throw new AppError('Too many invalid attempts. Verification code has been invalidated.', 400, 'AUTH_006');
      }

      const remaining = challengeDoc.maxAttempts - challengeDoc.attempts;
      throw new AppError(`Invalid verification code. ${remaining} attempt(s) remaining.`, 400, 'AUTH_006');
    }

    // Mark VerificationSession as VERIFIED
    sessionDoc.status = 'VERIFIED';
    sessionDoc.verifiedAt = new Date();
    await sessionDoc.save();

    // Delegate account and profile activation to AccountService
    const activationResult = await accountService.activateAccount({
      userUuid: user.userUuid,
      tenantId: user.tenantId,
      campusId: user.campusId
    });

    return {
      userUuid: activationResult.userUuid,
      email: activationResult.email,
      accountStatus: activationResult.accountStatus,
      emailVerified: activationResult.emailVerified,
      message: 'Account successfully verified and activated. Please sign in.'
    };
  }

  /**
   * Resend Verification OTP with 60s cooldown and 5/hr rate limits.
   */
  async resendEmailOtp({ email, tenantId = 'tenant_campus_01', campusId = 'main_campus', clientContext = {} }) {
    if (!email) {
      throw new ValidationError('Email address is required to resend verification code.', 'VAL_001');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ tenantId, email: normalizedEmail, isDeleted: false });
    if (!user) {
      throw new AppError('No account found for this email address.', 404, 'USER_NOT_FOUND');
    }

    if (user.accountStatus === 'ACTIVE') {
      throw new AppError('Account is already active. Please sign in.', 400, 'AUTH_002');
    }

    // Rate Limiting & Cooldown Checks
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentResendsCount = await VerificationSession.countDocuments({
      tenantId,
      email: normalizedEmail,
      createdAt: { $gte: oneHourAgo }
    });

    if (recentResendsCount >= 5) {
      throw new AppError('Maximum resend limit (5 per hour) exceeded. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const latestSession = await VerificationSession.findOne({
      tenantId,
      userUuid: user.userUuid,
      purpose: 'REGISTER'
    }).sort({ createdAt: -1 });

    if (latestSession && latestSession.lastSentAt) {
      const secondsSinceLastSent = (Date.now() - new Date(latestSession.lastSentAt).getTime()) / 1000;
      if (secondsSinceLastSent < 60) {
        const waitTime = Math.ceil(60 - secondsSinceLastSent);
        throw new AppError(`Please wait ${waitTime} second(s) before requesting another code.`, 429, 'COOLDOWN_ACTIVE');
      }
    }

    // Supersede old sessions
    await VerificationSession.updateMany(
      { userUuid: user.userUuid, purpose: 'REGISTER', status: 'PENDING' },
      { $set: { status: 'SUPERSEDED' } }
    );

    // Generate new session & challenge
    const provider = verificationProviderFactory.getProvider('OTP');
    const challenge = provider.generateChallenge();
    const version = (latestSession ? latestSession.version : 0) + 1;

    const newSessionDoc = new VerificationSession({
      tenantId: user.tenantId,
      campusId: user.campusId,
      userId: user._id,
      userUuid: user.userUuid,
      loginId: user.loginId,
      email: user.email,
      purpose: 'REGISTER',
      channel: 'EMAIL',
      version,
      status: 'PENDING',
      resendCount: (latestSession ? latestSession.resendCount : 0) + 1,
      ipAddress: clientContext.ipAddress,
      userAgent: clientContext.userAgent,
      deviceFingerprint: clientContext.deviceFingerprint
    });
    await newSessionDoc.save();

    const newChallengeDoc = new VerificationChallenge({
      sessionId: newSessionDoc.sessionId,
      challengeType: 'OTP',
      challengeHash: challenge.challengeHash,
      expiresAt: challenge.expiresAt,
      maxAttempts: challenge.maxAttempts
    });
    await newChallengeDoc.save();

    // Write Outbox Message
    const outboxMsg = new OutboxMessage({
      eventType: 'VERIFICATION_CREATED',
      payload: {
        sessionId: newSessionDoc.sessionId,
        userUuid: user.userUuid,
        loginId: user.loginId,
        email: user.email,
        rawCode: challenge.rawCode,
        purpose: 'REGISTER',
        channel: 'EMAIL',
        tenantId: user.tenantId,
        campusId: user.campusId,
        occurredAt: new Date().toISOString()
      }
    });
    await outboxMsg.save();

    setImmediate(() => {
      mongoOutboxProcessor.processPendingEvents().catch(err => logger.error('Resend outbox processing error:', err));
    });

    const isProduction = process.env.NODE_ENV === 'production';

    return {
      success: true,
      userUuid: user.userUuid,
      email: user.email,
      message: 'A new verification code has been dispatched to your email address.',
      rawOtpCodeForTesting: isProduction ? undefined : challenge.rawCode
    };
  }

  /**
   * Change email address for unverified accounts.
   */
  async changeUnverifiedEmail({ currentEmail, password, newEmail, tenantId = 'tenant_campus_01', campusId = 'main_campus', clientContext = {} }) {
    if (!currentEmail || !password || !newEmail) {
      throw new ValidationError('Current email, password, and new email are required.', 'VAL_001');
    }

    const normCurrent = currentEmail.toLowerCase().trim();
    const normNew = newEmail.toLowerCase().trim();

    if (normCurrent === normNew) {
      throw new ValidationError('New email address must be different from current email.', 'VAL_001');
    }

    const user = await User.findOne({ tenantId, email: normCurrent, isDeleted: false });
    if (!user) {
      throw new AppError('Account not found.', 404, 'USER_NOT_FOUND');
    }

    if (user.accountStatus === 'ACTIVE') {
      throw new AppError('Cannot change email of an active account via verification flow.', 400, 'AUTH_002');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid password credentials.', 401, 'AUTH_001');
    }

    // Check collision for newEmail
    const existingNew = await User.findOne({ tenantId, email: normNew, isDeleted: false });
    if (existingNew) {
      if (existingNew.accountStatus === 'ACTIVE') {
        throw new AppError(`Email address '${normNew}' is already registered to another account.`, 409, 'AUTH_002');
      }
    }

    // Execute email change via User aggregate method
    user.changeEmail(normNew);
    await user.save();

    // Trigger resend to new email address
    return await this.resendEmailOtp({
      email: normNew,
      tenantId,
      campusId,
      clientContext
    });
  }

  // Backwards compatibility helper
  async generateOtp(user, purpose = 'EMAIL_VERIFICATION', channel = 'EMAIL', session = null) {
    const provider = verificationProviderFactory.getProvider('OTP');
    const challenge = provider.generateChallenge();

    const verSession = new VerificationSession({
      tenantId: user.tenantId || 'tenant_campus_01',
      campusId: user.campusId || 'main_campus',
      userId: user._id,
      userUuid: user.userUuid,
      loginId: user.loginId,
      email: user.email,
      purpose: purpose === 'EMAIL_VERIFICATION' ? 'REGISTER' : purpose,
      channel: channel || 'EMAIL',
      version: Date.now(),
      status: 'PENDING'
    });
    await verSession.save({ session });

    const verChallenge = new VerificationChallenge({
      sessionId: verSession.sessionId,
      challengeType: 'OTP',
      challengeHash: challenge.challengeHash,
      expiresAt: challenge.expiresAt,
      maxAttempts: challenge.maxAttempts
    });
    await verChallenge.save({ session });

    return {
      otpUuid: verSession.sessionId,
      rawCode: challenge.rawCode,
      expiresAt: challenge.expiresAt
    };
  }

  async deleteOtpByUserId(userId, session = null) {
    await VerificationSession.deleteMany({ userId }).session(session);
  }
}

module.exports = new OtpService();

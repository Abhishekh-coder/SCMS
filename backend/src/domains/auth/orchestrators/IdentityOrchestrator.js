/**
 * CCMS — Identity Orchestrator
 *
 * Transaction coordinator executing atomic Mongo transactions:
 * Create User + Link InstitutionIdentity + Create VerificationSession & VerificationChallenge + Write OutboxMessage.
 */

const mongoose = require('mongoose');
const userService = require('../services/UserService');
const profileService = require('../services/ProfileService');
const transactionManager = require('../services/TransactionManager');
const verificationProviderFactory = require('../providers/VerificationProviderFactory');
const { VerificationSession } = require('../models/VerificationSession');
const { VerificationChallenge } = require('../models/VerificationChallenge');
const { OutboxMessage } = require('../models/OutboxMessage');
const { InstitutionIdentity } = require('../../identity/models/InstitutionIdentity');
const mongoOutboxProcessor = require('../../../infrastructure/outbox/MongoOutboxProcessor');
const { logger } = require('../../../config/logger');

class IdentityOrchestrator {
  async linkAndCreateIdentity(registrationData, clientContext = {}) {
    const { traceId, fullName, email, password, phone, role, loginId, profileDetails, tenantId, campusId } = registrationData;
    const { ipAddress, userAgent, deviceFingerprint } = clientContext;

    logger.info(`📍 [TRACE: ${traceId || 'N/A'}] [Stage 3: IdentityOrchestrator Started] Email: ${email} | Role: ${role}`);

    let createdUser = null;

    const compensatingRollback = async () => {
      if (createdUser && createdUser._id) {
        logger.warn(`🔄 Executing compensating rollback for User ID ${createdUser._id}`);
        try {
          const User = mongoose.models.User || mongoose.model('User');
          await User.deleteOne({ _id: createdUser._id });
          await VerificationSession.deleteMany({ userId: createdUser._id });
        } catch (err) {
          logger.error('Failed compensating rollback:', err);
        }
      }
    };

    const result = await transactionManager.executeTransaction(async (session) => {
      // 1. Create Base User in PENDING_VERIFICATION state
      const user = await userService.createUser({
        fullName,
        email,
        password,
        phone,
        role,
        loginId,
        tenantId,
        campusId
      }, session);

      createdUser = user;

      // 2. Link or Create InstitutionIdentity Record (status: PENDING_ACTIVATION)
      let identity = await InstitutionIdentity.findOne({
        tenantId: user.tenantId,
        campusId: user.campusId,
        loginId: user.loginId
      }).session(session);

      if (!identity) {
        identity = new InstitutionIdentity({
          tenantId: user.tenantId,
          campusId: user.campusId,
          loginId: user.loginId,
          fullName: user.fullName,
          email: user.email,
          identityType: role === 'STUDENT' ? 'STUDENT' : role === 'FACULTY' ? 'FACULTY' : 'ADMIN',
          status: 'PENDING_ACTIVATION',
          linkedUserUuid: user.userUuid,
          linkedUserId: user._id,
          linkedAt: new Date()
        });
      } else {
        identity.status = 'PENDING_ACTIVATION';
        identity.linkedUserUuid = user.userUuid;
        identity.linkedUserId = user._id;
        identity.linkedAt = new Date();
      }
      await identity.save({ session });

      // 3. Create Domain Profile (StudentProfile / FacultyProfile) in PENDING state
      const profile = await profileService.createProfile(user, role, profileDetails || {}, session);

      // 4. Mark old PENDING verification sessions as SUPERSEDED
      await VerificationSession.updateMany(
        { userUuid: user.userUuid, purpose: 'REGISTER', status: 'PENDING' },
        { $set: { status: 'SUPERSEDED' } }
      ).session(session);

      // 5. Create VerificationSession & VerificationChallenge
      const provider = verificationProviderFactory.getProvider('OTP');
      const challenge = provider.generateChallenge();
      const version = Date.now();

      const verSession = new VerificationSession({
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
        ipAddress,
        userAgent,
        deviceFingerprint
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

      // Save legacy Otp for backward compatibility
      const { OtpSchema } = require('../../../../../database/schema/schemas');
      const Otp = mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
      const legacyOtp = new Otp({
        otpUuid: verSession.sessionId,
        userId: user._id,
        userUuid: user.userUuid,
        purpose: 'EMAIL_VERIFICATION',
        channel: 'EMAIL',
        codeHash: challenge.challengeHash,
        email: user.email,
        expiresAt: challenge.expiresAt,
        status: 'PENDING'
      });
      await legacyOtp.save({ session });

      // Record Security Audit Log Entry
      const auditService = require('../services/AuditService');
      await auditService.logSecurityEvent(
        'USER_REGISTRATION_SUCCESS',
        user,
        ipAddress,
        userAgent,
        {
          role,
          accountStatus: user.accountStatus,
          otpUuid: verSession.sessionId
        },
        session
      );

      // 6. Write Transactional OutboxMessage
      const outboxMsg = new OutboxMessage({
        eventType: 'VERIFICATION_CREATED',
        payload: {
          traceId,
          sessionId: verSession.sessionId,
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
      await outboxMsg.save({ session });

      const logOtp = process.env.NODE_ENV === 'production' ? '[REDACTED]' : challenge.rawCode;
      logger.info(`📍 [Stage 4: Mongo Transaction Ready To Commit] UserUuid: ${user.userUuid} | OTP: ${logOtp}`);

      return {
        user,
        identity,
        verSession,
        rawCode: challenge.rawCode
      };
    }, compensatingRollback);

    logger.info(`📍 [Stage 5: Mongo Transaction Committed] UserUuid: ${result.user.userUuid} | Email: ${result.user.email}`);

    // Trigger OutboxProcessor post-commit (Outbox pattern is single source of event dispatch)
    setImmediate(() => {
      mongoOutboxProcessor.processPendingEvents().catch(err => logger.error('Outbox post-commit processing error:', err));
    });

    const eventPublisher = require('../../../events/publishers/EventPublisher');
    await eventPublisher.publish('UserRegistered', {
      userUuid: result.user.userUuid,
      userCode: result.user.userCode,
      email: result.user.email,
      role,
      tenantId: result.user.tenantId,
      campusId: result.user.campusId,
      occurredAt: new Date().toISOString()
    });

    const isProduction = process.env.NODE_ENV === 'production';

    return {
      userUuid: result.user.userUuid,
      userCode: result.user.userCode,
      loginId: result.user.loginId,
      email: result.user.email,
      accountStatus: result.user.accountStatus,
      rawOtpCodeForTesting: isProduction ? undefined : result.rawCode
    };
  }

  // Alias for backward compatibility
  async registerIdentity(registrationData, clientContext = {}) {
    return await this.linkAndCreateIdentity(registrationData, clientContext);
  }
}

module.exports = new IdentityOrchestrator();

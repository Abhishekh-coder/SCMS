/**
 * CCMS — Registration Service
 *
 * High-level service orchestrating registration validation, scoped IdempotencyService checks,
 * InstitutionIdentity verification, and delegating to IdentityOrchestrator.
 */

const identityOrchestrator = require('../orchestrators/IdentityOrchestrator');
const idempotencyService = require('./IdempotencyService');
const { InstitutionIdentity } = require('../../identity/models/InstitutionIdentity');
const { AppError, ValidationError } = require('../../../shared/errors/AppError');
const mongoose = require('mongoose');
const { UserSchema } = require('../../../../../database/schema/schemas');
const { logger } = require('../../../config/logger');

const User = mongoose.models.User || mongoose.model('User', UserSchema);

class RegistrationService {
  async register(registrationData, clientContext = {}, idempotencyKey = null) {
    const { traceId, fullName, email, password, phone, role, loginId, profileDetails, tenantId = 'tenant_campus_01', campusId = 'main_campus' } = registrationData;
    logger.info(`📍 [TRACE: ${traceId || 'N/A'}] [Stage 2: RegistrationService Started] Email: ${email} | IdempotencyKey: ${idempotencyKey || 'NONE'}`);

    try {
      // Idempotency evaluation
      if (idempotencyKey) {
        const idempotencyResult = await idempotencyService.process({
          idempotencyKey,
          tenantId,
          campusId,
          loginId,
          endpoint: '/api/v1/auth/register',
          body: registrationData
        }, async () => {
          return await this.executeRegistrationWorkflow(registrationData, clientContext);
        });

        logger.info(`📍 [TRACE: ${traceId || 'N/A'}] [Stage 2: Idempotency Evaluated] Returning response for key: ${idempotencyKey}`);
        return idempotencyResult.body;
      }

      return await this.executeRegistrationWorkflow(registrationData, clientContext);
    } catch (err) {
      logger.error(`❌ [TRACE: ${traceId || 'N/A'}] [Stage 2: RegistrationService Error]`, err.message);
      throw err;
    }
  }

  async executeRegistrationWorkflow(registrationData, clientContext) {
    const { traceId, fullName, email, password, phone, role = 'STUDENT', loginId, tenantId = 'tenant_campus_01', campusId = 'main_campus' } = registrationData;

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing account state for email
    const existingUser = await User.findOne({ tenantId, email: normalizedEmail, isDeleted: false });
    if (existingUser) {
      if (existingUser.accountStatus === 'ACTIVE') {
        logger.warn(`📍 [TRACE: ${traceId || 'N/A'}] [Stage 2B: Account Already Active] Email: ${normalizedEmail}`);
        throw new AppError('Email address is already registered and verified. Please sign in.', 409, 'AUTH_002');
      }
      if (existingUser.accountStatus === 'PENDING_VERIFICATION') {
        logger.info(`📍 [TRACE: ${traceId || 'N/A'}] [Stage 2B: Unverified Account Recovery] Dispatching fresh OTP for ${normalizedEmail}`);
        
        // Dispatch fresh OTP for unverified user on re-registration attempt
        try {
          const otpService = require('./OtpService');
          await otpService.resendEmailOtp({
            email: normalizedEmail,
            tenantId,
            campusId,
            clientContext
          });
        } catch (resendErr) {
          logger.warn(`📍 [TRACE: ${traceId || 'N/A'}] Unverified registration re-trigger OTP warning:`, resendErr.message);
        }

        return {
          success: true,
          requiresVerification: true,
          userUuid: existingUser.userUuid,
          userCode: existingUser.userCode,
          email: existingUser.email,
          accountStatus: existingUser.accountStatus,
          message: 'Account is registered and pending verification. A fresh verification code has been dispatched.'
        };
      }
    }

    // Delegate transaction execution to IdentityOrchestrator
    const result = await identityOrchestrator.linkAndCreateIdentity(registrationData, clientContext);

    return {
      success: true,
      requiresVerification: true,
      userUuid: result.userUuid,
      userCode: result.userCode,
      loginId: result.loginId,
      email: result.email,
      accountStatus: result.accountStatus,
      rawOtpCodeForTesting: result.rawOtpCodeForTesting
    };
  }
}

module.exports = new RegistrationService();

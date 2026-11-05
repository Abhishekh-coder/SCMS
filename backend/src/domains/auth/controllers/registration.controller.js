const registrationService = require('../services/RegistrationService');
const otpService = require('../services/OtpService');
const recaptchaService = require('../../../infrastructure/recaptcha/RecaptchaService');
const { AppError, ValidationError } = require('../../../shared/errors/AppError');
const crypto = require('crypto');

const { logger } = require('../../../config/logger');

class RegistrationController {
  async register(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    const idempotencyKey = req.headers['idempotency-key'] || null;

    try {
      const { fullName, email, password, phone, role, profileDetails, recaptchaToken, loginId } = req.body || {};
      logger.info(`📍 [Stage 1: RegistrationController Entered] RequestId: ${requestId} | Email: ${email} | Role: ${role || 'STUDENT'}`);

      // 1. Input Sanitization & Required Fields Check
      if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
        throw new ValidationError('Full name must be at least 2 characters long.', 'VAL_001');
      }

      if (!email || typeof email !== 'string' || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
        throw new ValidationError('A valid email address is required.', 'VAL_001');
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:',.<>\/])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:',.<>\/]{12,64}$/;
      if (!password || !passwordRegex.test(password)) {
        throw new ValidationError(
          'Password must be 12-64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
          'VAL_002'
        );
      }

      const allowedRoles = ['STUDENT', 'FACULTY'];
      const targetRole = role ? role.toUpperCase().trim() : 'STUDENT';
      if (!allowedRoles.includes(targetRole)) {
        throw new ValidationError(`Self-registration is only permitted for roles: ${allowedRoles.join(', ')}.`, 'VAL_001');
      }

      // 2. Security: reCAPTCHA Verification
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await recaptchaService.verifyToken(recaptchaToken, clientIp);

      // 3. Client Context
      const clientContext = {
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        deviceFingerprint: crypto.createHash('sha256').update(`${clientIp}-${req.headers['user-agent']}`).digest('hex')
      };

      const registrationResult = await registrationService.register({
        traceId: requestId,
        fullName,
        email,
        password,
        phone,
        role: targetRole,
        loginId,
        profileDetails: profileDetails || {},
        tenantId: req.headers['x-tenant-id'] || 'tenant_campus_01',
        campusId: req.headers['x-campus-id'] || 'main_campus'
      }, clientContext, idempotencyKey);

      return res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
          userUuid: registrationResult.userUuid,
          userCode: registrationResult.userCode,
          loginId: registrationResult.loginId,
          email: registrationResult.email,
          accountStatus: registrationResult.accountStatus,
          requiresVerification: true,
          devOtpCode: registrationResult.rawOtpCodeForTesting
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { email, otpCode, verificationToken } = req.body || {};

      const result = await otpService.verifyEmailOtp({
        email,
        otpCode,
        verificationToken,
        tenantId: req.headers['x-tenant-id'] || 'tenant_campus_01',
        campusId: req.headers['x-campus-id'] || 'main_campus'
      });

      return res.status(200).json({
        success: true,
        message: result.message || 'Email verified successfully. Your account is now active.',
        data: result,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { email } = req.body || {};
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const result = await otpService.resendEmailOtp({
        email,
        tenantId: req.headers['x-tenant-id'] || 'tenant_campus_01',
        campusId: req.headers['x-campus-id'] || 'main_campus',
        clientContext: {
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          deviceFingerprint: crypto.createHash('sha256').update(`${clientIp}-${req.headers['user-agent']}`).digest('hex')
        }
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async changeEmail(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { currentEmail, password, newEmail } = req.body || {};
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const result = await otpService.changeUnverifiedEmail({
        currentEmail,
        password,
        newEmail,
        tenantId: req.headers['x-tenant-id'] || 'tenant_campus_01',
        campusId: req.headers['x-campus-id'] || 'main_campus',
        clientContext: {
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          deviceFingerprint: crypto.createHash('sha256').update(`${clientIp}-${req.headers['user-agent']}`).digest('hex')
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Email address updated. A new verification code has been dispatched.',
        data: result,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async debugEmail(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Debug email endpoint is disabled in production.', 403, 'FORBIDDEN');
      }

      const { recipient } = req.body || {};
      const targetEmail = recipient || process.env.EMAIL_FROM || 'admin@campus.edu';
      const notificationDispatcher = require('../../notifications/NotificationDispatcher');

      const result = await notificationDispatcher.sendVerification({
        channel: 'EMAIL',
        recipient: targetEmail,
        purpose: 'SMTP_DEBUG_TEST',
        challengeData: {
          rawCode: '999999'
        }
      });

      return res.status(200).json({
        success: true,
        message: `SMTP Debug Email sent to ${targetEmail}`,
        data: result,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async resetRegistration(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Development reset endpoint is disabled in production.', 403, 'FORBIDDEN');
      }

      const { email } = req.body || {};
      if (!email) {
        throw new ValidationError('Email address is required for reset.', 'VAL_001');
      }

      const normalizedEmail = email.toLowerCase().trim();
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;

      const collections = [
        'users',
        'verificationsessions',
        'verificationchallenges',
        'otps',
        'outboxmessages',
        'sessions',
        'refreshtokens',
        'auditlogs',
        'studentprofiles',
        'facultyprofiles',
        'institutionidentities'
      ];

      const deletedCounts = {};
      for (const colName of collections) {
        try {
          const res = await db.collection(colName).deleteMany({
            $or: [
              { email: normalizedEmail },
              { 'payload.email': normalizedEmail },
              { 'details.email': normalizedEmail }
            ]
          });
          deletedCounts[colName] = res.deletedCount;
        } catch (e) {
          deletedCounts[colName] = 0;
        }
      }

      return res.status(200).json({
        success: true,
        message: `Registration data for '${normalizedEmail}' reset successfully.`,
        data: {
          email: normalizedEmail,
          deletedCounts
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RegistrationController();

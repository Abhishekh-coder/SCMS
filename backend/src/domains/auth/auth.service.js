const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwtService = require('../../security/authentication/jwt.service');
const sessionService = require('./session.service');
const auditService = require('../audit/audit.service');
const identityConfig = require('./identityConfig');
const { parseLoginId } = require('./LoginIdParser');
const { eventBus } = require('../../events/eventBus');
const { DOMAIN_EVENTS } = require('../../shared/constants/events');
const { ROLES } = require('../../shared/constants/roles');
const { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } = require('../../shared/errors/AppError');
const { logger } = require('../../config/logger');

const { UserSchema, OrganizationalAssignmentSchema } = require('../../../../database/schema/schemas');
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment', OrganizationalAssignmentSchema);

class AuthService {
  constructor() {
    this.users = new Map(); // In-memory user identity store
    this.otps = new Map(); // Verification OTP engine store
    this.tokenFamilies = new Map(); // Refresh token family store for replay protection
  }

  async register({ fullName, userCode, email, password, role = ROLES.STUDENT, profileData, req }) {
    if (this.users.has(email)) {
      throw new ValidationError(`User with email '${email}' already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userUuid = `usr_${crypto.randomUUID()}`;

    const newUser = {
      userUuid,
      userCode: userCode || `CODE-${Date.now().toString().slice(-4)}`,
      fullName,
      email,
      passwordHash,
      accountStatus: 'PENDING_VERIFICATION',
      role,
      roles: [role], // Multi-role support
      passwordHistory: [
        {
          passwordHash,
          changedAt: new Date(),
          changedBy: 'SELF_REGISTER',
          reason: 'FIRST_LOGIN'
        }
      ],
      failedLoginCount: 0,
      emailVerified: false,
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus',
      createdAt: new Date()
    };

    this.users.set(email, newUser);

    // 1. Generate Email Verification OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.otps.set(email, {
      purpose: 'EMAIL_VERIFICATION',
      channel: 'EMAIL',
      code: otpCode,
      userUuid,
      expiresAt: new Date(Date.now() + identityConfig.otpPolicy.expiryMinutes * 60 * 1000),
      attempts: 0
    });

    // 2. Publish UserRegistered Domain Event
    eventBus.publish(DOMAIN_EVENTS.USER_REGISTERED, {
      userUuid,
      email,
      fullName,
      role,
      timestamp: new Date()
    });

    // 3. Record Audit Log
    auditService.recordEvent({
      eventType: 'UserRegistered',
      userUuid,
      ipAddress: req ? req.ip : '127.0.0.1',
      details: { role, accountStatus: newUser.accountStatus }
    });

    return {
      userUuid,
      fullName: newUser.fullName,
      email: newUser.email,
      accountStatus: newUser.accountStatus,
      verificationOtpSent: true
    };
  }

  async login({ loginId, email, password, req }) {
    // Accept both loginId (new) and email (legacy) as credential
    const credential = loginId || email;
    const ipAddress  = req ? req.ip : '127.0.0.1';

    if (!credential) {
      throw new ValidationError('Login ID or email is required.');
    }

    // Parse loginId to understand profile type before DB hit
    const parsed = parseLoginId(credential);
    // Note: if invalid format AND not an email, we still try to find user by email
    // This allows institutional email as fallback login credential.

    // Look up user in MongoDB by loginId first, then email
    let user = await User.findOne({
      $or: [
        { loginId: credential.toUpperCase().trim() },
        { email: credential.toLowerCase().trim() }
      ],
      isDeleted: false
    });

    if (!user) {
      user = this.users.get(credential.toUpperCase());
      if (!user) {
        for (const [, u] of this.users.entries()) {
          if (u.email && u.email.toLowerCase() === credential.toLowerCase()) {
            user = u;
            break;
          }
        }
      }
    }

    if (!user) {
      auditService.recordEvent({ eventType: 'LoginFailed', userUuid: null, details: { credential, reason: 'User Not Found' } });
      throw new UnauthorizedError('Invalid credentials. Please check your Login ID and password.');
    }

    if (user.accountStatus === 'LOCKED') {
      auditService.recordEvent({ eventType: 'LoginFailed', userUuid: user.userUuid, details: { reason: 'Account Locked' } });
      throw new ForbiddenError('Account is locked due to multiple failed attempts. Contact IT helpdesk to unlock.');
    }

    if (user.accountStatus === 'PENDING_ACTIVATION') {
      throw new ForbiddenError('Account not yet activated. Use the Activate Account option on the login page.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      user.failedLoginCount = (user.failedLoginCount || 0) + 1;
      auditService.recordEvent({ eventType: 'LoginFailed', userUuid: user.userUuid, details: { failedCount: user.failedLoginCount } });

      if (user.failedLoginCount >= identityConfig.lockoutPolicy.maxFailedAttempts) {
        user.accountStatus = 'LOCKED';
      }
      if (typeof user.save === 'function') {
        await user.save().catch(() => {});
      }
      throw new UnauthorizedError('Invalid credentials. Please check your Login ID and password.');
    }

    // Successful auth
    user.failedLoginCount = 0;
    user.accountStatus    = 'ACTIVE';
    user.lastLogin        = new Date();
    if (typeof user.save === 'function') {
      await user.save().catch(() => {});
    }

    const session  = sessionService.createSession({ userId: user.userUuid, userUuid: user.userUuid, req });
    const familyId = `fam_${crypto.randomUUID()}`;

    // Resolve backend-enforced organizational assignment identity
    let primaryRole = user.profileType === 'STUDENT' ? 'STUDENT' : (user.roles && user.roles[0]) || 'FACULTY';
    let roles = user.roles?.length ? [...user.roles] : [primaryRole];

    if (user._id) {
      const activeAsgn = await OrganizationalAssignment.findOne({ assigneeUserId: user._id, isActive: true });
      if (activeAsgn && activeAsgn.assignmentType) {
        primaryRole = activeAsgn.assignmentType;
        if (!roles.includes(primaryRole)) {
          roles.unshift(primaryRole);
        }
      }
    }

    const payload = {
      userId:     user.userUuid,   // canonical identifier in JWT
      userUuid:   user.userUuid,
      loginId:    user.loginId || credential.toUpperCase(),
      primaryRole,
      roles,                        // what the frontend uses for routing
      tenantId:   user.tenantId,
      sessionUuid: session.sessionUuid,
    };

    const accessToken  = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken({ ...payload, familyId, generation: 1 });

    this.tokenFamilies.set(familyId, {
      familyId, userUuid: user.userUuid, currentGeneration: 1, latestToken: refreshToken, revoked: false
    });

    eventBus.publish(DOMAIN_EVENTS.USER_LOGGED_IN, {
      userUuid: user.userUuid, loginId: user.loginId, roles, sessionUuid: session.sessionUuid, timestamp: new Date()
    });

    auditService.recordEvent({
      eventType: 'UserLoggedIn',
      userUuid:  user.userUuid,
      ipAddress,
      details:   { loginId: user.loginId, sessionUuid: session.sessionUuid, roles }
    });

    return {
      userUuid:    user.userUuid,
      fullName:    user.fullName,
      loginId:     user.loginId || credential.toUpperCase(),
      email:       user.email,
      primaryRole,
      roles,
      profileType: user.profileType,
      accountStatus: user.accountStatus,
      accessToken,
      refreshToken,
      session,
    };
  }

  async refreshTokenRotation({ refreshToken }) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required.');
    }

    let decoded;
    try {
      decoded = jwtService.verifyRefreshToken(refreshToken);
    } catch (e) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    const { familyId, generation, userUuid } = decoded;
    const family = this.tokenFamilies.get(familyId);

    if (!family || family.revoked) {
      auditService.recordEvent({ eventType: 'RefreshTokenReplayAttackDetected', userUuid, details: { familyId } });
      throw new ForbiddenError('Token family has been revoked due to security replay detection.');
    }

    // Token Replay Detection: If token generation is behind the latest active generation, someone is replaying an old token!
    if (generation < family.currentGeneration) {
      family.revoked = true; // Revoke entire family!
      logger.error(`🚨 Security Alert: Refresh Token Replay Attack detected on Family ${familyId}! Revoking entire family.`);
      sessionService.revokeAllSessions(userUuid);
      throw new ForbiddenError('Security Violation: Refresh token replay attack detected. All active sessions terminated.');
    }

    // Increment Generation Counter
    family.currentGeneration += 1;

    const payload = {
      userUuid: decoded.userUuid,
      email: decoded.email,
      role: decoded.role,
      roles: decoded.roles,
      tenantId: decoded.tenantId,
      sessionUuid: decoded.sessionUuid
    };

    const newAccessToken = jwtService.generateAccessToken(payload);
    const newRefreshToken = jwtService.generateRefreshToken({ ...payload, familyId, generation: family.currentGeneration });

    family.latestToken = newRefreshToken;

    auditService.recordEvent({ eventType: 'RefreshTokenRotated', userUuid, details: { familyId, generation: family.currentGeneration } });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async verifyEmail({ email, otpCode }) {
    const otp = this.otps.get(email);
    if (!otp || otp.code !== otpCode) {
      throw new ValidationError('Invalid or expired verification OTP.');
    }

    const user = this.users.get(email);
    if (user) {
      user.emailVerified = true;
      user.accountStatus = 'ACTIVE';
    }

    this.otps.delete(email);
    auditService.recordEvent({ eventType: 'EmailVerified', userUuid: user ? user.userUuid : null, details: { email } });

    return { success: true, message: 'Email verified successfully. Account is now ACTIVE.' };
  }

  async forgotPassword({ email }) {
    const user = this.users.get(email);
    if (!user) {
      return { success: true, message: 'If an account exists, a password reset link has been dispatched.' };
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otps.set(`reset_${email}`, {
      purpose: 'PASSWORD_RESET',
      channel: 'EMAIL',
      code: resetOtp,
      userUuid: user.userUuid,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    eventBus.publish('PasswordResetRequested', { userUuid: user.userUuid, email, otpCode: resetOtp });
    auditService.recordEvent({ eventType: 'PasswordResetRequested', userUuid: user.userUuid });

    return { success: true, message: 'Password reset OTP dispatched to registered email.' };
  }

  async resetPassword({ email, otpCode, newPassword }) {
    const otpKey = `reset_${email}`;
    const otp = this.otps.get(otpKey);

    if (!otp || otp.code !== otpCode) {
      throw new ValidationError('Invalid or expired password reset OTP.');
    }

    const user = this.users.get(email);
    if (!user) throw new NotFoundError('User account not found.');

    // Enforce Password History (check last 5 password hashes)
    for (const hist of user.passwordHistory.slice(-identityConfig.passwordPolicy.historyLimit)) {
      const isMatch = await bcrypt.compare(newPassword, hist.passwordHash);
      if (isMatch) {
        throw new ValidationError('New password cannot match any of your last 5 previous passwords.');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = newHash;
    user.accountStatus = 'ACTIVE';
    user.failedLoginCount = 0;
    user.passwordHistory.push({
      passwordHash: newHash,
      changedAt: new Date(),
      changedBy: 'USER_RESET',
      reason: 'PASSWORD_RESET'
    });

    this.otps.delete(otpKey);
    auditService.recordEvent({ eventType: 'PasswordResetCompleted', userUuid: user.userUuid });

    return { success: true, message: 'Password reset successfully. Account unlocked and ready.' };
  }

  getUserProfile(userUuid) {
    for (const [, user] of this.users.entries()) {
      if (user.userUuid === userUuid) {
        return {
          userUuid: user.userUuid,
          fullName: user.fullName,
          userCode: user.userCode,
          email: user.email,
          role: user.role,
          roles: user.roles,
          accountStatus: user.accountStatus,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin
        };
      }
    }
    throw new NotFoundError('User profile not found.');
  }
}

module.exports = new AuthService();

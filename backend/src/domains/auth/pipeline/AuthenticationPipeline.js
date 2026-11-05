const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const sessionService = require('../services/SessionService');
const tokenService = require('../services/TokenService');
const auditService = require('../services/AuditService');
const recaptchaService = require('../../../infrastructure/recaptcha/RecaptchaService');
const eventPublisher = require('../../../events/publishers/EventPublisher');
const { UserSchema, UserRoleSchema, RoleSchema, OrganizationalAssignmentSchema } = require('../../../../../database/schema/schemas');
const { AppError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../config/logger');

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const UserRole = mongoose.models.UserRole || mongoose.model('UserRole', UserRoleSchema);
const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment', OrganizationalAssignmentSchema);

class AuthenticationPipeline {
  async executeLogin(credentials, clientContext = {}) {
    const { loginId, email, password, recaptchaToken } = credentials;
    const identifier = (loginId || email || '').trim();
    const { ipAddress, userAgent } = clientContext;

    // 1. Validation & Input Sanitization
    if (!identifier || !password) {
      throw new AppError('Institutional Login ID and password are required.', 400, 'VAL_001');
    }

    const normalizedIdentifier = identifier.toUpperCase();
    const normalizedEmail = identifier.toLowerCase();

    // 2. reCAPTCHA Security Verification
    await recaptchaService.verifyToken(recaptchaToken, ipAddress);

    // 3. Identity Lookup (Lookup by loginId OR email)
    const user = await User.findOne({
      $or: [
        { loginId: normalizedIdentifier },
        { email: normalizedEmail }
      ],
      isDeleted: false
    });
    if (!user) {
      await eventPublisher.publish('LoginFailed', {
        loginId: identifier,
        reason: 'USER_NOT_FOUND',
        ipAddress,
        occurredAt: new Date().toISOString()
      });
      throw new AppError('Invalid Login ID or password.', 401, 'AUTH_001');
    }

    // 4. Account Status Validation
    if (user.accountStatus === 'LOCKED') {
      throw new AppError('Account is locked due to multiple failed login attempts. Contact administrator or initiate password reset.', 403, 'AUTH_003');
    }

    if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'DISABLED' || user.accountStatus === 'ARCHIVED') {
      throw new AppError('Account access has been restricted or disabled.', 403, 'AUTH_003');
    }

    if (user.accountStatus === 'PENDING_VERIFICATION') {
      throw new AppError('Account is pending verification. Please verify your email.', 403, 'PENDING_VERIFICATION', {
        requiresVerification: true,
        email: user.email,
        userUuid: user.userUuid,
      });
    }

    // 5. Password Verification & Lockout Logic
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginCount += 1;

      if (user.failedLoginCount >= 5) {
        user.accountStatus = 'LOCKED';
        logger.warn(`🔒 Account LOCKED for user ${user.email} due to 5 consecutive failed login attempts.`);
      }

      await user.save();

      await eventPublisher.publish('LoginFailed', {
        userUuid: user.userUuid,
        email: user.email,
        reason: 'INVALID_PASSWORD',
        failedLoginCount: user.failedLoginCount,
        accountLocked: user.accountStatus === 'LOCKED',
        ipAddress,
        occurredAt: new Date().toISOString()
      });

      if (user.accountStatus === 'LOCKED') {
        throw new AppError('Account is now locked due to multiple failed login attempts.', 403, 'AUTH_003');
      }

      throw new AppError('Invalid email or password.', 401, 'AUTH_001');
    }

    // Reset Lockout Counter on Successful Authentication
    user.failedLoginCount = 0;
    user.lastLogin = new Date();
    await user.save();

    // Fetch User Roles (UserRole → Role, with denormalized fallbacks)
    const userRoleDocs = await UserRole.find({ userId: user._id, isActive: true });
    let roles = [];
    if (userRoleDocs.length > 0) {
      const roleIds = userRoleDocs.filter(ur => ur.roleId).map(ur => ur.roleId);
      if (roleIds.length > 0) {
        const roleObjs = await Role.find({ _id: { $in: roleIds } });
        roles = roleObjs.map(r => r.code);
      }
      if (roles.length === 0) {
        roles = userRoleDocs.map(ur => ur.role).filter(Boolean);
      }
    }
    if (roles.length === 0 && user.roles?.length) {
      roles = user.roles;
    }
    if (roles.length === 0) {
      if (user.profileType === 'ADMIN') roles = ['ADMIN'];
      else if (user.profileType === 'FACULTY') roles = ['FACULTY'];
      else roles = ['STUDENT'];
    }
    let primaryRole = user.profileType === 'STUDENT' ? 'STUDENT' : (roles && roles[0]) || 'FACULTY';
    const activeAsgn = await OrganizationalAssignment.findOne({ assigneeUserId: user._id, isActive: true });
    if (activeAsgn && activeAsgn.assignmentType) {
      primaryRole = activeAsgn.assignmentType;
      if (!roles.includes(primaryRole)) {
        roles.unshift(primaryRole);
      }
    }
    roles = [...new Set(roles)];

    // 6. Session Creation
    const session = await sessionService.createSession(user, clientContext);

    // 7. JWT & Refresh Token Family Generation
    const tokenData = await tokenService.issueTokenFamily(user, session.sessionUuid, roles);

    // 8. Security Audit Log
    await auditService.logSecurityEvent('USER_LOGIN_SUCCESS', user, ipAddress, userAgent, {
      sessionUuid: session.sessionUuid,
      roles
    });

    // 9. Publish Domain Events
    await eventPublisher.publish('SessionCreated', {
      sessionUuid: session.sessionUuid,
      userUuid: user.userUuid,
      ipAddress: session.ipAddress,
      occurredAt: new Date().toISOString()
    });

    await eventPublisher.publish('UserLoggedIn', {
      userUuid: user.userUuid,
      userCode: user.userCode,
      email: user.email,
      roles,
      tenantId: user.tenantId,
      campusId: user.campusId,
      sessionId: session.sessionUuid,
      ipAddress: session.ipAddress,
      browser: session.browser,
      deviceName: session.deviceName,
      occurredAt: new Date().toISOString()
    });

    return {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      userUuid: user.userUuid || user._id?.toString(),
      userCode: user.userCode || user.loginId,
      loginId: user.loginId,
      fullName: user.fullName || user.loginId,
      email: user.email,
      profileType: user.profileType,
      primaryRole,
      roles,
      user: {
        userUuid: user.userUuid || user._id?.toString(),
        userCode: user.userCode || user.loginId,
        loginId: user.loginId,
        fullName: user.fullName || user.loginId,
        email: user.email,
        profileType: user.profileType,
        primaryRole,
        roles
      },
      tokens: tokenData,
      sessionId: session.sessionUuid
    };
  }
}

module.exports = new AuthenticationPipeline();

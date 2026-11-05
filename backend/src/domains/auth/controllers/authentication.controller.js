const authenticationPipeline = require('../pipeline/AuthenticationPipeline');
const tokenService = require('../services/TokenService');
const sessionService = require('../services/SessionService');
const auditService = require('../services/AuditService');
const eventPublisher = require('../../../events/publishers/EventPublisher');
const { AppError } = require('../../../shared/errors/AppError');
const crypto = require('crypto');

class AuthenticationController {
  async login(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { loginId, email, password, recaptchaToken, deviceFingerprint } = req.body || {};

      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const clientContext = {
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        deviceFingerprint
      };

      const result = await authenticationPipeline.executeLogin({
        loginId,
        email,
        password,
        recaptchaToken
      }, clientContext);

      return res.status(200).json({
        success: true,
        message: 'Authentication successful.',
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

  async refresh(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { refreshToken } = req.body || {};
      if (!refreshToken) {
        throw new AppError('Refresh token is required in request body.', 400, 'AUTH_004');
      }

      const rotatedTokens = await tokenService.rotateRefreshToken(refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Token rotated successfully.',
        data: rotatedTokens,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { refreshToken } = req.body || {};
      const sessionUuid = req.session ? req.session.sessionUuid : req.body.sessionId;

      if (sessionUuid) {
        await sessionService.revokeSession(sessionUuid);
        await tokenService.revokeSessionTokens(sessionUuid);
      }

      const user = req.user;
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      await auditService.logSecurityEvent('USER_LOGOUT_SUCCESS', user || null, clientIp, req.headers['user-agent'], {
        sessionUuid
      });

      await eventPublisher.publish('UserLoggedOut', {
        userUuid: user ? user.userUuid : null,
        sessionUuid,
        occurredAt: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully. Tokens and session revoked.',
        data: null,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const user = req.user;
      const session = req.session;

      return res.status(200).json({
        success: true,
        message: 'Current authenticated user profile retrieved.',
        data: {
          user: {
            userUuid: user.userUuid,
            userCode: user.userCode,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            accountStatus: user.accountStatus,
            roles: req.tokenPayload ? req.tokenPayload.roles : ['STUDENT'],
            emailVerified: user.emailVerified,
            lastLogin: user.lastLogin
          },
          session: session ? {
            sessionUuid: session.sessionUuid,
            browser: session.browser,
            OS: session.OS,
            ipAddress: session.ipAddress,
            lastSeen: session.lastSeen
          } : null
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

  async getWorkspaceBootstrap(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const user = req.user;
      const session = req.session;
      const roles = req.tokenPayload ? req.tokenPayload.roles : (user.roles || ['STUDENT']);

      // Fetch user active permissions from permissionProvider
      const permissionProvider = require('../../../security/permissionProvider');
      const permContext = await permissionProvider.getUserPermissions(user);
      const permissions = Array.from(permContext.permissions || []);

      // Fetch user active assignments
      const mongoose = require('mongoose');
      const { OrganizationalAssignmentSchema } = require('../../../../../database/schema/schemas');
      const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment', OrganizationalAssignmentSchema);
      const assignments = await OrganizationalAssignment.find({
        assigneeUserId: user._id,
        isActive: true
      }).lean();

      const { resolveWorkspaceRedirect } = require('../services/WorkspaceRedirectService');
      const workspaceRedirect = resolveWorkspaceRedirect({
        roles,
        profileType: user.profileType,
        assignments
      });

      // Dynamic Navigation Builder
      const navigation = [];
      navigation.push({ id: 'dashboard', label: 'Dashboard', route: '/workspace/dashboard', icon: 'LayoutDashboard' });

      if (roles.includes('STUDENT') || permissions.includes('complaint:create')) {
        navigation.push({ id: 'my-complaints', label: 'My Complaints', route: '/workspace/complaints/my', icon: 'FileText' });
        navigation.push({ id: 'lodge-complaint', label: 'Lodge Complaint', route: '/workspace/complaints/new', icon: 'PlusCircle' });
      }

      if (roles.some(r => ['FACULTY', 'HOD', 'DEAN', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'].includes(r)) || permissions.includes('complaint:view_assigned')) {
        navigation.push({ id: 'assigned-queue', label: 'Assigned Queue', route: '/workspace/complaints/assigned', icon: 'Inbox' });
      }

      if (roles.includes('HOD') || assignments.some(a => a.assignmentType === 'HOD')) {
        navigation.push({ id: 'dept-analytics', label: 'Department Overview', route: '/workspace/analytics/department', icon: 'BarChart3' });
      }

      if (roles.some(r => ['DEAN', 'PRINCIPAL'].includes(r)) || assignments.some(a => ['DEAN', 'PRINCIPAL'].includes(a.assignmentType))) {
        navigation.push({ id: 'executive-analytics', label: 'Executive Insights', route: '/workspace/analytics/executive', icon: 'TrendingUp' });
      }

      if (roles.some(r => ['ADMIN', 'SUPER_ADMIN'].includes(r))) {
        navigation.push({ id: 'master-data', label: 'Master Data & Governance', route: '/workspace/admin/governance', icon: 'ShieldAlert' });
      }

      // Widget Registry Allocation
      const widgets = [];
      if (roles.includes('STUDENT')) {
        widgets.push('MY_COMPLAINTS_SUMMARY', 'QUICK_LODGE_WIDGET', 'ACTIVE_NOTIFICATIONS');
      }
      if (roles.some(r => ['FACULTY', 'HOD', 'DEAN', 'PRINCIPAL'].includes(r))) {
        widgets.push('ASSIGNED_COMPLAINTS_METRICS', 'SLA_BREACH_HEATMAP', 'RECENT_ACTIVITY');
      }
      if (roles.some(r => ['HOD', 'DEAN', 'PRINCIPAL', 'ADMIN'].includes(r))) {
        widgets.push('DEPARTMENT_WORKLOAD_DISTRIBUTION', 'POWER_BI_EXEC_FEED');
      }

      return res.status(200).json({
        success: true,
        message: 'Workspace bootstrap data generated successfully.',
        data: {
          user: {
            userUuid: user.userUuid,
            loginId: user.loginId || user.userCode,
            fullName: user.fullName || user.loginId,
            email: user.email,
            phone: user.phone,
            accountStatus: user.accountStatus,
            profileType: user.profileType,
            roles
          },
          session: session ? {
            sessionUuid: session.sessionUuid,
            browser: session.browser,
            OS: session.OS,
            ipAddress: session.ipAddress
          } : null,
          permissions,
          assignments,
          navigation,
          widgets,
          needsWorkspaceSelection: workspaceRedirect.needsWorkspaceSelection,
          noWorkspace: workspaceRedirect.noWorkspace,
          defaultWorkspace: workspaceRedirect.defaultWorkspace,
          redirectTo: workspaceRedirect.redirectTo,
          navigation,
          widgets,
          featureFlags: {
            aiAssistEnabled: true,
            globalSearchEnabled: true,
            powerBiEmbedEnabled: true,
            realtimeWebsockets: true
          },
          theme: {
            mode: 'dark',
            accent: 'indigo'
          }
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

module.exports = new AuthenticationController();

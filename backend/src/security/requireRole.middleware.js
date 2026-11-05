const { AppError } = require('../shared/errors/AppError');
const auditService = require('../domains/audit/audit.service');

/**
 * requireRole(...roles)
 *
 * RBAC middleware — verifies that req.user.roles contains at least one
 * of the required roles. Must be used AFTER authenticateToken.
 *
 * Usage:
 *   router.get('/department/analytics',
 *     authenticateToken,
 *     requireRole('HOD', 'DEAN', 'PRINCIPAL'),
 *     analyticsController.getDeptSummary
 *   );
 *
 * If a STUDENT hits this route → 403 Forbidden + audit log.
 * Student never receives HOD data. Ever.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return next(new AppError('Authentication required.', 401, 'AUTH_007'));
    }

    // Normalize: support both user.roles[] and user.role string
    const userRoles = Array.isArray(user.roles)
      ? user.roles
      : (user.role ? [user.role] : []);

    const hasRole = allowedRoles.some(r => userRoles.includes(r));

    if (!hasRole) {
      // Audit every unauthorized access attempt
      auditService.recordEvent({
        eventType:  'UnauthorizedRoleAccess',
        userUuid:   user.userUuid,
        ipAddress:  req.ip,
        details: {
          userRoles,
          requiredRoles: allowedRoles,
          path:    req.originalUrl,
          method:  req.method,
        }
      });

      return next(new AppError(
        `Access Denied: Role(s) [${userRoles.join(', ')}] cannot access this resource. ` +
        `Required: [${allowedRoles.join(', ')}].`,
        403,
        'AUTH_008'
      ));
    }

    // Attach which role matched (useful for downstream context)
    req.effectiveRole = userRoles.find(r => allowedRoles.includes(r));
    next();
  };
}

module.exports = { requireRole };

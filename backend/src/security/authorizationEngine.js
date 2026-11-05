const permissionProvider = require('./permissionProvider');
const { logger } = require('../config/logger');

class AuthorizationEngine {
  async evaluateAccess(user, requiredPermission, policyContext = {}, resourceContext = null) {
    if (!user) {
      return { allowed: false, reason: 'UNAUTHENTICATED' };
    }

    // 1. Fetch User Permission Matrix & Profile Context from Cache / DB
    const userAuth = await permissionProvider.getUserPermissions(user);
    const { permissions, roles, profileContext } = userAuth;

    // SYSTEM_ADMIN role override
    if (roles.includes('SYSTEM_ADMIN')) {
      return { allowed: true, reason: 'SYSTEM_ADMIN_OVERRIDE' };
    }

    // 2. Permission Code Check
    if (requiredPermission && !permissions.has(requiredPermission)) {
      return { allowed: false, reason: `MISSING_PERMISSION_${requiredPermission}` };
    }

    // If no resourceContext provided, static permission check succeeds
    if (!resourceContext) {
      return { allowed: true, reason: 'STATIC_PERMISSION_GRANTED' };
    }

    // 3. Multi-Tenancy Isolation Policy (Tenant & Campus Match)
    if (resourceContext.tenantId && resourceContext.tenantId !== user.tenantId) {
      return { allowed: false, reason: 'TENANT_MISMATCH_ISOLATION' };
    }

    if (resourceContext.campusId && resourceContext.campusId !== user.campusId) {
      return { allowed: false, reason: 'CAMPUS_MISMATCH_ISOLATION' };
    }

    // 4. Ownership Policy Evaluation (checkOwnership)
    if (policyContext.checkOwnership) {
      const isOwner = resourceContext.ownerUuid === user.userUuid || resourceContext.createdById === user._id.toString();
      if (!isOwner && !roles.includes('DEPT_HEAD') && !roles.includes('CAMPUS_ADMIN')) {
        return { allowed: false, reason: 'OWNERSHIP_POLICY_VIOLATION' };
      }
    }

    // 5. Department Policy Evaluation (checkDepartment)
    if (policyContext.checkDepartment) {
      const userDept = profileContext.departmentId;
      const resourceDept = resourceContext.departmentId;
      if (userDept && resourceDept && userDept !== resourceDept && !roles.includes('CAMPUS_ADMIN')) {
        return { allowed: false, reason: 'DEPARTMENT_POLICY_VIOLATION' };
      }
    }

    return { allowed: true, reason: 'POLICY_EVALUATION_PASSED' };
  }
}

module.exports = new AuthorizationEngine();

const mongoose = require('mongoose');
const { UserRoleSchema, RoleSchema, StudentProfileSchema, FacultyProfileSchema } = require('../../../database/schema/schemas');
const { logger } = require('../config/logger');

const UserRole = mongoose.models.UserRole || mongoose.model('UserRole', UserRoleSchema);
const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile', FacultyProfileSchema);

class PermissionProvider {
  constructor() {
    this.cache = new Map(); // Cache structure: userId -> { permissions: Set, roles: Array, profileContext: Object, expiresAt: Number }
    this.ttlMs = 10 * 60 * 1000; // 10 minutes cache TTL
  }

  async getUserPermissions(user) {
    if (!user) return { permissions: new Set(), roles: [], profileContext: {}, expiresAt: 0 };
    const userIdStr = (user._id || user.userUuid || 'user').toString();
    const now = Date.now();

    // 1. Check Memory Cache
    if (this.cache.has(userIdStr)) {
      const cached = this.cache.get(userIdStr);
      if (cached.expiresAt > now) {
        return cached;
      }
      this.cache.delete(userIdStr); // Expired cache entry
    }

    // 2. Fetch User Roles & Filter Expired Temporary Roles
    const roleQuery = user._id ? { userId: user._id } : { userUuid: user.userUuid };
    const userRoles = await UserRole.find({
      ...roleQuery,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    let roleCodes = ['STUDENT'];
    let permissionsSet = new Set();

    if (userRoles.length > 0) {
      const roleIds = userRoles.map(ur => ur.roleId);
      const roleDocs = await Role.find({ _id: { $in: roleIds } });

      if (roleDocs.length > 0) {
        roleCodes = roleDocs.map(r => r.code);
        roleDocs.forEach(r => {
          if (Array.isArray(r.permissions)) {
            r.permissions.forEach(p => permissionsSet.add(p));
          }
        });
      }
    }

    // Always grant core complaint permissions to Students
    if (user.roles?.includes('STUDENT') || user.profileType === 'STUDENT' || roleCodes.includes('STUDENT')) {
      permissionsSet.add('complaint:create');
      permissionsSet.add('complaint:view_own');
    }
    
    // Always grant handler permissions to Faculty and Leadership
    if (user.roles?.some(r => ['FACULTY', 'HOD', 'DEAN', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'].includes(r))) {
      permissionsSet.add('complaint:view_assigned');
      permissionsSet.add('complaint:resolve');
    }

    // 3. Fetch User Profile Context for ABAC Policy Evaluation
    let profileContext = { departmentId: null, rollNumber: null, employeeId: null };
    const studentProfile = await StudentProfile.findOne({ userId: user._id, isDeleted: false });
    if (studentProfile) {
      profileContext.rollNumber = studentProfile.rollNumber;
      profileContext.branch = studentProfile.branch;
    }

    const facultyProfile = await FacultyProfile.findOne({ userId: user._id, isDeleted: false });
    if (facultyProfile) {
      profileContext.departmentId = facultyProfile.departmentId;
      profileContext.employeeId = facultyProfile.employeeId;
    }

    const cacheEntry = {
      permissions: permissionsSet,
      roles: roleCodes,
      profileContext,
      expiresAt: now + this.ttlMs
    };

    // 4. Save to Memory Cache
    this.cache.set(userIdStr, cacheEntry);
    logger.debug(`⚡ Cached permission matrix for user ${user.email} (${permissionsSet.size} permissions, ${roleCodes.length} roles)`);

    return cacheEntry;
  }

  clearUserCache(userId) {
    const key = typeof userId === 'object' ? userId.toString() : userId;
    this.cache.delete(key);
    logger.info(`🧹 Cleared permission cache for user ID ${key}`);
  }

  clearAllCache() {
    this.cache.clear();
    logger.info('🧹 Cleared entire permission provider cache.');
  }
}

module.exports = new PermissionProvider();

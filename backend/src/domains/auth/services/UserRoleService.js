const mongoose = require('mongoose');
const roleService = require('./RoleService');
const permissionProvider = require('../../../security/permissionProvider');
const eventPublisher = require('../../../events/publishers/EventPublisher');
const { UserRoleSchema, UserSchema } = require('../../../../../database/schema/schemas');
const { AppError } = require('../../../shared/errors/AppError');

const UserRole = mongoose.models.UserRole || mongoose.model('UserRole', UserRoleSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

class UserRoleService {
  async assignRoleToUser(userUuid, roleCode, assignedBy = 'SYSTEM_ADMIN', expiresAt = null) {
    const user = await User.findOne({ userUuid, isDeleted: false });
    if (!user) {
      throw new AppError(`User with UUID '${userUuid}' not found.`, 404, 'NOT_FOUND');
    }

    const role = await roleService.getRoleByCode(roleCode);

    // Upsert UserRole junction
    const userRole = await UserRole.findOneAndUpdate(
      { userId: user._id, roleId: role._id },
      {
        $set: {
          assignedBy,
          assignedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }
      },
      { upsert: true, new: true }
    );

    // Invalidate Permission Provider Cache for User
    permissionProvider.clearUserCache(user._id);

    // Publish RoleAssigned Event
    await eventPublisher.publish('RoleAssigned', {
      userUuid: user.userUuid,
      roleCode: role.code,
      assignedBy,
      expiresAt,
      occurredAt: new Date().toISOString()
    });

    return userRole;
  }

  async revokeRoleFromUser(userUuid, roleCode) {
    const user = await User.findOne({ userUuid, isDeleted: false });
    if (!user) {
      throw new AppError(`User with UUID '${userUuid}' not found.`, 404, 'NOT_FOUND');
    }

    const role = await roleService.getRoleByCode(roleCode);

    await UserRole.deleteOne({ userId: user._id, roleId: role._id });

    // Invalidate Permission Provider Cache
    permissionProvider.clearUserCache(user._id);

    // Publish RoleRevoked Event
    await eventPublisher.publish('RoleRevoked', {
      userUuid: user.userUuid,
      roleCode: role.code,
      occurredAt: new Date().toISOString()
    });
  }
}

module.exports = new UserRoleService();

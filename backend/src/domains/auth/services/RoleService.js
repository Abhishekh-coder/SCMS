const mongoose = require('mongoose');
const { RoleSchema } = require('../../../../../database/schema/schemas');
const { AppError } = require('../../../shared/errors/AppError');

const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);

class RoleService {
  async createRole(roleData) {
    const { name, code, description, permissions } = roleData;
    const uppercaseCode = code.toUpperCase().trim();

    const existingRole = await Role.findOne({ $or: [{ code: uppercaseCode }, { name: name.trim() }] });
    if (existingRole) {
      throw new AppError(`Role with code '${uppercaseCode}' or name '${name}' already exists.`, 409, 'AUTH_002');
    }

    const role = new Role({
      name: name.trim(),
      code: uppercaseCode,
      description: description ? description.trim() : '',
      permissions: Array.isArray(permissions) ? permissions : []
    });

    return await role.save();
  }

  async getAllRoles() {
    return await Role.find({});
  }

  async getRoleByCode(code) {
    const role = await Role.findOne({ code: code.toUpperCase().trim() });
    if (!role) {
      throw new AppError(`Role '${code}' not found.`, 404, 'NOT_FOUND');
    }
    return role;
  }
}

module.exports = new RoleService();

const mongoose = require('mongoose');
const { PermissionSchema } = require('../../../../../database/schema/schemas');
const PERMISSION_CATALOG = require('../constants/permissionCatalog');

const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);

class PermissionService {
  async seedPermissions() {
    const permissions = Object.values(PERMISSION_CATALOG);
    for (const p of permissions) {
      await Permission.updateOne(
        { code: p.code },
        { $setOnInsert: p },
        { upsert: true }
      );
    }
  }

  async getAllPermissions() {
    return await Permission.find({});
  }
}

module.exports = new PermissionService();

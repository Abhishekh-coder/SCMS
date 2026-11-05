const { logger } = require('../../../config/logger');

class ModuleRegistry {
  constructor() {
    this.registeredModules = new Map();
    this.initCoreModules();
  }

  initCoreModules() {
    this.registerModule('HOSTEL', { name: 'Hostel Grievance Module', version: '1.0.0', status: 'ACTIVE' });
    this.registerModule('TRANSPORT', { name: 'Campus Transport Module', version: '1.0.0', status: 'ACTIVE' });
    this.registerModule('LIBRARY', { name: 'Library Assistance Module', version: '1.0.0', status: 'ACTIVE' });
    this.registerModule('ERP', { name: 'Academic ERP Sync Module', version: '1.0.0', status: 'ACTIVE' });
  }

  registerModule(moduleCode, metadata) {
    const code = moduleCode.toUpperCase().trim();
    this.registeredModules.set(code, {
      moduleCode: code,
      ...metadata,
      registeredAt: new Date()
    });
    logger.info(`🔌 [ModuleRegistry] Registered Plugin Module: '${code}' (${metadata.name})`);
  }

  getModules() {
    return Array.from(this.registeredModules.values());
  }
}

module.exports = new ModuleRegistry();

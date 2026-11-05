const mongoose = require('mongoose');
const eventPublisher = require('../../../events/publishers/EventPublisher');
const {
  DepartmentMasterSchema,
  AcademicMasterSchema,
  ComplaintMetadataSchema
} = require('../../../../../database/schema/masterDataSchemas');
const { logger } = require('../../../config/logger');
const { AppError } = require('../../../shared/errors/AppError');

const DepartmentMaster = mongoose.models.DepartmentMaster || mongoose.model('DepartmentMaster', DepartmentMasterSchema);
const AcademicMaster = mongoose.models.AcademicMaster || mongoose.model('AcademicMaster', AcademicMasterSchema);
const ComplaintMetadata = mongoose.models.ComplaintMetadata || mongoose.model('ComplaintMetadata', ComplaintMetadataSchema);

class ReferenceDataService {
  constructor() {
    this.cache = new Map();
    this.ttlMs = 15 * 60 * 1000; // 15 minutes cache TTL
    this.initEventListener();
  }

  initEventListener() {
    eventPublisher.on('MasterDataUpdated', (event) => {
      const { domain } = event.payload || {};
      this.invalidateCache(domain);
    });
  }

  invalidateCache(domain = null) {
    if (!domain) {
      this.cache.clear();
      logger.info('🧹 ReferenceDataService: Invalidated ALL master data caches.');
      return;
    }
    this.cache.delete(domain);
    logger.info(`🧹 ReferenceDataService: Invalidated '${domain}' master data cache.`);
  }

  async getDepartments(tenantId = 'tenant_campus_01') {
    const cacheKey = `depts_${tenantId}`;
    const now = Date.now();

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expiresAt > now) return cached.data;
      this.cache.delete(cacheKey);
    }

    const depts = await DepartmentMaster.find({ tenantId, isCurrent: true, status: 'ACTIVE' });
    this.cache.set(cacheKey, { data: depts, expiresAt: now + this.ttlMs });
    return depts;
  }

  async getDepartmentByCode(code, tenantId = 'tenant_campus_01') {
    const uppercaseCode = code.toUpperCase().trim();
    const depts = await this.getDepartments(tenantId);
    const found = depts.find(d => d.departmentCode === uppercaseCode);
    if (!found) {
      throw new AppError(`Department '${uppercaseCode}' not found in master reference data.`, 404, 'NOT_FOUND');
    }
    return found;
  }

  async getCategories(tenantId = 'tenant_campus_01') {
    const cacheKey = `categories_${tenantId}`;
    const now = Date.now();

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expiresAt > now) return cached.data;
      this.cache.delete(cacheKey);
    }

    const categories = await ComplaintMetadata.find({ tenantId, isCurrent: true, status: 'ACTIVE' });
    this.cache.set(cacheKey, { data: categories, expiresAt: now + this.ttlMs });
    return categories;
  }

  async getCategoryByCode(categoryCode, subcategoryCode, tenantId = 'tenant_campus_01') {
    const catCode = categoryCode.toUpperCase().trim();
    const subCode = subcategoryCode ? subcategoryCode.toUpperCase().trim() : null;

    const categories = await this.getCategories(tenantId);
    const match = categories.find(c => c.categoryCode === catCode && (!subCode || c.subcategoryCode === subCode));
    if (!match) {
      throw new AppError(`Complaint category '${catCode}' / '${subCode}' not found.`, 404, 'NOT_FOUND');
    }
    return match;
  }
}

module.exports = new ReferenceDataService();

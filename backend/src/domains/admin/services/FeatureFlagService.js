const mongoose = require('mongoose');
const { FeatureFlagSchema } = require('../../../../../database/schema/adminSchemas');
const { logger } = require('../../../config/logger');

const FeatureFlag = mongoose.models.FeatureFlag || mongoose.model('FeatureFlag', FeatureFlagSchema);

class FeatureFlagService {
  constructor() {
    this.cache = new Map();
    this.ttlMs = 5 * 60 * 1000;
  }

  async isFeatureEnabled(flagCode, tenantId = 'tenant_campus_01') {
    const uppercaseCode = flagCode.toUpperCase().trim();
    const cacheKey = `flag_${uppercaseCode}`;
    const now = Date.now();

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expiresAt > now) return cached.isEnabled;
      this.cache.delete(cacheKey);
    }

    if (mongoose.connection.readyState === 0) {
      return true; // Fallback enabled in unit test mode
    }

    const flag = await FeatureFlag.findOne({ flagCode: uppercaseCode });
    const isEnabled = flag ? flag.isEnabled : true;
    this.cache.set(cacheKey, { isEnabled, expiresAt: now + this.ttlMs });

    return isEnabled;
  }

  async setFeatureFlag(flagCode, isEnabled, name = '', description = '') {
    const uppercaseCode = flagCode.toUpperCase().trim();
    const flag = await FeatureFlag.findOneAndUpdate(
      { flagCode: uppercaseCode },
      {
        $set: {
          flagCode: uppercaseCode,
          name: name || uppercaseCode,
          description,
          isEnabled: Boolean(isEnabled)
        }
      },
      { upsert: true, new: true }
    );

    this.cache.delete(`flag_${uppercaseCode}`);
    logger.info(`🚩 [FeatureFlagService] Set Flag '${uppercaseCode}' = ${isEnabled}`);
    return flag;
  }
}

module.exports = new FeatureFlagService();

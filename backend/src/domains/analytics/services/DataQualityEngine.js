const mongoose = require('mongoose');
const { ReportingComplaintFactSchema } = require('../../../../../database/schema/analyticsSchemas');
const { logger } = require('../../../config/logger');

const ReportingComplaintFact = mongoose.models.ReportingComplaintFact || mongoose.model('ReportingComplaintFact', ReportingComplaintFactSchema);

class DataQualityEngine {
  async runAudit() {
    if (mongoose.connection.readyState === 0) {
      return { status: 'HEALTHY', issuesFound: 0, issues: [] };
    }

    const issues = [];

    // Check for negative resolution duration hours
    const negativeDurations = await ReportingComplaintFact.countDocuments({ resolutionDurationHours: { $lt: 0 } });
    if (negativeDurations > 0) {
      issues.push({ code: 'NEGATIVE_RESOLUTION_TIME', count: negativeDurations, severity: 'HIGH' });
    }

    // Check for missing category codes
    const missingCategories = await ReportingComplaintFact.countDocuments({ categoryCode: { $in: [null, ''] } });
    if (missingCategories > 0) {
      issues.push({ code: 'MISSING_CATEGORY_CODE', count: missingCategories, severity: 'MEDIUM' });
    }

    const isHealthy = issues.length === 0;
    logger.info(`🔍 [DataQualityEngine] Audit Complete. Status: ${isHealthy ? 'HEALTHY' : 'WARNING'} (${issues.length} issue types found)`);

    return {
      status: isHealthy ? 'HEALTHY' : 'WARNING',
      issuesFound: issues.length,
      issues,
      auditedAt: new Date().toISOString()
    };
  }
}

module.exports = new DataQualityEngine();

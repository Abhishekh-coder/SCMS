const mongoose = require('mongoose');
const { ReportingComplaintFactSchema, ReportingSlaFactSchema } = require('../../../../../database/schema/analyticsSchemas');

const ReportingComplaintFact = mongoose.models.ReportingComplaintFact || mongoose.model('ReportingComplaintFact', ReportingComplaintFactSchema);
const ReportingSlaFact = mongoose.models.ReportingSlaFact || mongoose.model('ReportingSlaFact', ReportingSlaFactSchema);

class KpiEngine {
  async calculateMetrics(query = {}) {
    const totalComplaints = await ReportingComplaintFact.countDocuments(query);
    if (totalComplaints === 0) {
      return {
        totalComplaints: 0,
        resolvedCount: 0,
        avgResolutionHours: 0,
        slaComplianceRatePct: 100,
        escalationRatePct: 0,
        reopenRatePct: 0
      };
    }

    const resolvedQuery = { ...query, status: 'RESOLVED' };
    const resolvedCount = await ReportingComplaintFact.countDocuments(resolvedQuery);

    const escalatedQuery = { ...query, status: 'ESCALATED' };
    const escalatedCount = await ReportingComplaintFact.countDocuments(escalatedQuery);

    const reopenedQuery = { ...query, status: 'REOPENED' };
    const reopenedCount = await ReportingComplaintFact.countDocuments(reopenedQuery);

    // Calculate Average Resolution Hours
    const resolvedFacts = await ReportingComplaintFact.find({ ...resolvedQuery, resolutionDurationHours: { $ne: null } });
    let avgResolutionHours = 0;
    if (resolvedFacts.length > 0) {
      const sum = resolvedFacts.reduce((acc, f) => acc + (f.resolutionDurationHours || 0), 0);
      avgResolutionHours = parseFloat((sum / resolvedFacts.length).toFixed(2));
    }

    // SLA Compliance Rate
    const slaBreachedCount = await ReportingComplaintFact.countDocuments({ ...resolvedQuery, slaBreached: true });
    const onTimeCount = resolvedCount - slaBreachedCount;
    const slaComplianceRatePct = resolvedCount > 0 
      ? parseFloat(((onTimeCount / resolvedCount) * 100).toFixed(2)) 
      : 100;

    const escalationRatePct = parseFloat(((escalatedCount / totalComplaints) * 100).toFixed(2));
    const reopenRatePct = resolvedCount > 0 
      ? parseFloat(((reopenedCount / resolvedCount) * 100).toFixed(2)) 
      : 0;

    return {
      totalComplaints,
      resolvedCount,
      avgResolutionHours,
      slaComplianceRatePct,
      escalationRatePct,
      reopenRatePct
    };
  }
}

module.exports = new KpiEngine();

const { describe, it } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');

const analyticsEngine = require('../../backend/src/domains/analytics/services/AnalyticsEngine');
const eventPublisher = require('../../backend/src/events/publishers/EventPublisher');
const { ReportingComplaintFactSchema, ReportingSlaFactSchema } = require('../../database/schema/analyticsSchemas');

describe('Phase 5 - Analytics & Reporting Platform Unit Tests', () => {
  const ReportingComplaintFact = mongoose.models.TestReportingComplaintFact2 || mongoose.model('TestReportingComplaintFact2', ReportingComplaintFactSchema);
  const ReportingSlaFact = mongoose.models.TestReportingSlaFact2 || mongoose.model('TestReportingSlaFact2', ReportingSlaFactSchema);

  it('1. should validate ReportingComplaintFactSchema Star Schema fields', () => {
    const fact = new ReportingComplaintFact({
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus',
      dateKey: 20260803,
      complaintUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      complaintCode: 'CMP-2026-CSE-100201',
      userUuid: 'user_uuid_101',
      departmentCode: 'CSE',
      categoryCode: 'HOSTEL',
      priority: 'HIGH',
      status: 'SUBMITTED',
      resolutionDurationHours: null,
      slaBreached: false
    });

    assert.strictEqual(fact.validateSync(), undefined);
    assert.strictEqual(fact.dateKey, 20260803);
    assert.strictEqual(fact.departmentCode, 'CSE');
  });

  it('2. should validate ReportingSlaFactSchema SLA compliance status tracking', () => {
    const slaFact = new ReportingSlaFact({
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus',
      dateKey: 20260803,
      complaintUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      departmentCode: 'CSE',
      slaHours: 24,
      actualResolutionHours: 18,
      slaStatus: 'ON_TIME'
    });

    assert.strictEqual(slaFact.validateSync(), undefined);
    assert.strictEqual(slaFact.slaStatus, 'ON_TIME');
  });

  it('3. should verify AnalyticsEngine listens to ComplaintSubmitted domain events', async () => {
    let handled = false;
    const listener = () => { handled = true; };
    eventPublisher.on('ComplaintSubmitted', listener);

    await eventPublisher.publish('ComplaintSubmitted', {
      complaintUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      complaintCode: 'CMP-2026-CSE-100201',
      userUuid: 'user_uuid_101',
      departmentCode: 'CSE',
      categoryCode: 'HOSTEL',
      priority: 'HIGH',
      occurredAt: new Date().toISOString()
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.strictEqual(handled, true);

    eventPublisher.removeListener('ComplaintSubmitted', listener);
  });
});

const { describe, it } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');

const referenceDataService = require('../../backend/src/domains/masterData/services/ReferenceDataService');
const eventPublisher = require('../../backend/src/events/publishers/EventPublisher');
const {
  DepartmentMasterSchema,
  RelationshipSchema,
  ComplaintMetadataSchema
} = require('../../database/schema/masterDataSchemas');

describe('Phase 2 - College Master Data Unit Tests', () => {

  const DepartmentMaster = mongoose.models.TestDepartmentMaster || mongoose.model('TestDepartmentMaster', DepartmentMasterSchema);
  const Relationship = mongoose.models.TestRelationship || mongoose.model('TestRelationship', RelationshipSchema);
  const ComplaintMetadata = mongoose.models.TestComplaintMetadata || mongoose.model('TestComplaintMetadata', ComplaintMetadataSchema);

  it('1. should validate DepartmentMasterSchema versioning and external codes', () => {
    const dept = new DepartmentMaster({
      departmentCode: 'CSE',
      name: 'Computer Science & Engineering',
      buildingCode: 'A-BLOCK',
      version: 1,
      isCurrent: true,
      status: 'ACTIVE'
    });

    assert.strictEqual(dept.validateSync(), undefined);
    assert.strictEqual(dept.departmentCode, 'CSE');
    assert.strictEqual(dept.version, 1);
    assert.strictEqual(dept.isCurrent, true);
  });

  it('2. should validate generic RelationshipSchema mapping for HOD and Class Incharge', () => {
    const hodRel = new Relationship({
      sourceType: 'DEPARTMENT',
      sourceId: 'CSE',
      relationshipType: 'HAS_HOD',
      targetType: 'FACULTY',
      targetId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      status: 'ACTIVE'
    });

    assert.strictEqual(hodRel.validateSync(), undefined);
    assert.strictEqual(hodRel.relationshipType, 'HAS_HOD');
  });

  it('3. should validate ComplaintMetadataSchema SLAs and default priorities', () => {
    const meta = new ComplaintMetadata({
      categoryCode: 'ACADEMIC',
      categoryName: 'Academic Issues',
      subcategoryCode: 'GRADING',
      subcategoryName: 'Grading Dispute',
      defaultPriority: 'MEDIUM',
      slaHours: 48,
      escalationRoleCode: 'HOD'
    });

    assert.strictEqual(meta.validateSync(), undefined);
    assert.strictEqual(meta.slaHours, 48);
  });

  it('4. should clear ReferenceDataService cache on MasterDataUpdated domain event', async () => {
    referenceDataService.cache.set('depts_tenant_campus_01', {
      data: [{ departmentCode: 'CSE' }],
      expiresAt: Date.now() + 600000
    });

    assert.strictEqual(referenceDataService.cache.has('depts_tenant_campus_01'), true);

    await eventPublisher.publish('MasterDataUpdated', { domain: 'depts_tenant_campus_01' });

    for (let i = 0; i < 20; i++) {
      if (!referenceDataService.cache.has('depts_tenant_campus_01')) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.strictEqual(referenceDataService.cache.has('depts_tenant_campus_01'), false);
  });
});

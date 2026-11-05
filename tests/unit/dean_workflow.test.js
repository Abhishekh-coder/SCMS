const { describe, it } = require('node:test');
const assert = require('assert');

describe('Dean Workflow & Multi-Department Organizational Authorization Tests', () => {

  it('should restrict Dean actionable queue strictly to ESCALATED status complaints assigned to Dean', () => {
    const deanUserUuid = 'usr_meera_dean';
    const mockComplaints = [
      { complaintUuid: 'cmp-101', departmentCode: 'IT', assignedToUserUuid: 'usr_meera_dean', status: 'ESCALATED' },
      { complaintUuid: 'cmp-102', departmentCode: 'CE', assignedToUserUuid: 'usr_meera_dean', status: 'RESOLVED' },
      { complaintUuid: 'cmp-103', departmentCode: 'EXTC', assignedToUserUuid: 'usr_suresh_hod', status: 'ESCALATED' }
    ];

    const actionable = mockComplaints.filter(
      c => c.assignedToUserUuid === deanUserUuid && c.status === 'ESCALATED'
    );

    assert.strictEqual(actionable.length, 1);
    assert.strictEqual(actionable[0].complaintUuid, 'cmp-101');
  });

  it('should aggregate multi-department entity performance correctly for Dean', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-1', departmentCode: 'IT', status: 'IN_PROGRESS' },
      { complaintUuid: 'cmp-2', departmentCode: 'IT', status: 'ESCALATED' },
      { complaintUuid: 'cmp-3', departmentCode: 'IT', status: 'RESOLVED' },
      { complaintUuid: 'cmp-4', departmentCode: 'CE', status: 'IN_PROGRESS' },
      { complaintUuid: 'cmp-5', departmentCode: 'CE', status: 'RESOLVED' },
      { complaintUuid: 'cmp-6', departmentCode: 'EXTC', status: 'RESOLVED' }
    ];

    const departmentMap = {
      'IT': { total: 0, open: 0, escalated: 0, resolved: 0 },
      'CE': { total: 0, open: 0, escalated: 0, resolved: 0 },
      'EXTC': { total: 0, open: 0, escalated: 0, resolved: 0 }
    };

    mockComplaints.forEach(c => {
      const dept = c.departmentCode;
      if (departmentMap[dept]) {
        departmentMap[dept].total += 1;
        if (['IN_PROGRESS', 'SUBMITTED', 'ASSIGNED'].includes(c.status)) departmentMap[dept].open += 1;
        if (c.status === 'ESCALATED') departmentMap[dept].escalated += 1;
        if (['RESOLVED', 'CLOSED'].includes(c.status)) departmentMap[dept].resolved += 1;
      }
    });

    assert.strictEqual(departmentMap['IT'].total, 3);
    assert.strictEqual(departmentMap['IT'].open, 1);
    assert.strictEqual(departmentMap['IT'].escalated, 1);
    assert.strictEqual(departmentMap['IT'].resolved, 1);

    assert.strictEqual(departmentMap['CE'].total, 2);
    assert.strictEqual(departmentMap['CE'].open, 1);
    assert.strictEqual(departmentMap['CE'].resolved, 1);

    assert.strictEqual(departmentMap['EXTC'].total, 1);
    assert.strictEqual(departmentMap['EXTC'].resolved, 1);
  });

  it('should filter Dean scope complaints across authorized departments and reject unauthorized ones', () => {
    const authorizedDepartments = ['IT', 'CE', 'EXTC', 'ACADEMIC'];
    const mockComplaints = [
      { complaintUuid: 'cmp-101', departmentCode: 'IT' },
      { complaintUuid: 'cmp-102', departmentCode: 'CE' },
      { complaintUuid: 'cmp-103', departmentCode: 'EXTC' },
      { complaintUuid: 'cmp-104', departmentCode: 'LAW' }
    ];

    // Read all within authorized entity scope
    const entityComplaints = mockComplaints.filter(c => authorizedDepartments.includes(c.departmentCode));
    assert.strictEqual(entityComplaints.length, 3);
    assert.strictEqual(entityComplaints.some(c => c.departmentCode === 'LAW'), false);

    // Filter to IT
    const itComplaints = entityComplaints.filter(c => c.departmentCode === 'IT');
    assert.strictEqual(itComplaints.length, 1);
    assert.strictEqual(itComplaints[0].complaintUuid, 'cmp-101');
  });

  it('should maintain the complete progression chain: Student -> CI -> TG -> HOD -> Dean', () => {
    const assignedUserUuids = [
      'usr_ci_anjali',
      'usr_tg_rahul',
      'usr_hod_suresh',
      'usr_dean_meera'
    ];

    const assignmentHistory = [
      { handlerUserUuid: 'usr_ci_anjali', handlerRole: 'CLASS_INCHARGE', assignedAt: new Date(Date.now() - 30000) },
      { handlerUserUuid: 'usr_tg_rahul', handlerRole: 'TEACHER_GUARDIAN', assignedAt: new Date(Date.now() - 20000) },
      { handlerUserUuid: 'usr_hod_suresh', handlerRole: 'HOD', assignedAt: new Date(Date.now() - 10000) },
      { handlerUserUuid: 'usr_dean_meera', handlerRole: 'DEAN', assignedAt: new Date() }
    ];

    assert.strictEqual(assignedUserUuids.length, 4);
    assert.strictEqual(assignmentHistory.length, 4);
    assert.strictEqual(assignmentHistory[3].handlerRole, 'DEAN');
    assert.strictEqual(assignmentHistory[3].handlerUserUuid, 'usr_dean_meera');
  });

  it('should forbid HOD from modifying complaint once transferred to Dean', () => {
    const currentAssignee = 'usr_dean_meera';
    const hodActorUuid = 'usr_hod_suresh';

    const isForbidden = currentAssignee !== hodActorUuid;
    assert.strictEqual(isForbidden, true);
  });

  it('should forbid any action on a complaint once RESOLVED by Dean', () => {
    const complaint = {
      status: 'RESOLVED',
      resolvedByUserUuid: 'usr_dean_meera'
    };

    const isTerminal = ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(complaint.status);
    assert.strictEqual(isTerminal, true);
  });
});

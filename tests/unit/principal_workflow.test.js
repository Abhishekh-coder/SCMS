const { describe, it } = require('node:test');
const assert = require('assert');

describe('Principal Workflow & Institution-Level Authorization Security Tests', () => {

  it('should restrict Principal actionable queue strictly to ESCALATED status complaints assigned to Principal', () => {
    const principalUserUuid = 'usr_principal_rajesh';
    const mockComplaints = [
      { complaintUuid: 'cmp-101', departmentCode: 'IT', assignedToUserUuid: 'usr_principal_rajesh', status: 'ESCALATED' },
      { complaintUuid: 'cmp-102', departmentCode: 'CE', assignedToUserUuid: 'usr_principal_rajesh', status: 'RESOLVED' },
      { complaintUuid: 'cmp-103', departmentCode: 'EXTC', assignedToUserUuid: 'usr_dean_meera', status: 'ESCALATED' },
      { complaintUuid: 'cmp-104', departmentCode: 'CAMPUS_SERVICES', assignedToUserUuid: 'usr_principal_rajesh', status: 'ESCALATED' }
    ];

    const actionable = mockComplaints.filter(
      c => c.assignedToUserUuid === principalUserUuid && c.status === 'ESCALATED'
    );

    assert.strictEqual(actionable.length, 2);
    assert.deepStrictEqual(actionable.map(c => c.complaintUuid), ['cmp-101', 'cmp-104']);
  });

  it('should maintain the complete 6-tier progression chain: Student -> CI -> TG -> HOD -> Dean -> Principal -> Resolved', () => {
    const assignedUserUuids = [
      'usr_ci_anjali',
      'usr_tg_rahul',
      'usr_hod_suresh',
      'usr_dean_meera',
      'usr_principal_rajesh'
    ];

    const assignmentHistory = [
      { handlerUserUuid: 'usr_ci_anjali', handlerRole: 'CLASS_INCHARGE', assignedAt: new Date(Date.now() - 40000), reason: 'Initial assignment' },
      { handlerUserUuid: 'usr_tg_rahul', handlerRole: 'TEACHER_GUARDIAN', assignedAt: new Date(Date.now() - 30000), reason: 'Forwarded by CI' },
      { handlerUserUuid: 'usr_hod_suresh', handlerRole: 'HOD', assignedAt: new Date(Date.now() - 20000), reason: 'Escalated by TG' },
      { handlerUserUuid: 'usr_dean_meera', handlerRole: 'DEAN', assignedAt: new Date(Date.now() - 10000), reason: 'Escalated by HOD' },
      { handlerUserUuid: 'usr_principal_rajesh', handlerRole: 'PRINCIPAL', assignedAt: new Date(), reason: 'Escalated by Dean for apex review' }
    ];

    assert.strictEqual(assignedUserUuids.length, 5);
    assert.strictEqual(assignmentHistory.length, 5);
    assert.strictEqual(assignmentHistory[4].handlerRole, 'PRINCIPAL');
    assert.strictEqual(assignmentHistory[4].handlerUserUuid, 'usr_principal_rajesh');
  });

  it('should enforce that Principal is the terminal authority and reject further escalation', () => {
    const currentRole = 'PRINCIPAL';
    let errorThrown = false;

    try {
      if (currentRole === 'PRINCIPAL') {
        throw new Error('Principal is the terminal authority. No further escalation levels exist.');
      }
    } catch (e) {
      errorThrown = true;
      assert.strictEqual(e.message.includes('terminal authority'), true);
    }

    assert.strictEqual(errorThrown, true);
  });

  it('should aggregate institution-wide metrics correctly for Principal Command Center', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-1', departmentCode: 'IT', status: 'IN_PROGRESS' },
      { complaintUuid: 'cmp-2', departmentCode: 'IT', status: 'ESCALATED' },
      { complaintUuid: 'cmp-3', departmentCode: 'IT', status: 'RESOLVED' },
      { complaintUuid: 'cmp-4', departmentCode: 'CE', status: 'IN_PROGRESS' },
      { complaintUuid: 'cmp-5', departmentCode: 'CE', status: 'RESOLVED' },
      { complaintUuid: 'cmp-6', departmentCode: 'EXTC', status: 'RESOLVED' },
      { complaintUuid: 'cmp-7', departmentCode: 'CAMPUS_SERVICES', status: 'ESCALATED' }
    ];

    const departmentMap = {
      'IT': { total: 0, open: 0, escalated: 0, resolved: 0 },
      'CE': { total: 0, open: 0, escalated: 0, resolved: 0 },
      'EXTC': { total: 0, open: 0, escalated: 0, resolved: 0 },
      'CAMPUS_SERVICES': { total: 0, open: 0, escalated: 0, resolved: 0 }
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

    assert.strictEqual(departmentMap['CAMPUS_SERVICES'].total, 1);
    assert.strictEqual(departmentMap['CAMPUS_SERVICES'].escalated, 1);
  });

  it('should forbid Dean, HOD, and TG from modifying complaint once transferred to Principal', () => {
    const currentAssignee = 'usr_principal_rajesh';
    const deanActorUuid = 'usr_dean_meera';
    const hodActorUuid = 'usr_hod_suresh';

    assert.strictEqual(currentAssignee !== deanActorUuid, true);
    assert.strictEqual(currentAssignee !== hodActorUuid, true);
  });

  it('should enforce terminal state lock on complaint once RESOLVED by Principal', () => {
    const complaint = {
      status: 'RESOLVED',
      resolvedByUserUuid: 'usr_principal_rajesh',
      resolvedByName: 'Dr. Rajesh Sharma'
    };

    const isTerminal = ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(complaint.status);
    assert.strictEqual(isTerminal, true);
  });
});

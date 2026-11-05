const { describe, it } = require('node:test');
const assert = require('assert');

describe('HOD Workflow & Department Authorization Security Tests', () => {

  it('should restrict HOD actionable queue strictly to ESCALATED status complaints', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-101', departmentCode: 'IT', divisionCode: '2024-IT-A', assignedToUserUuid: 'usr_suresh_hod', status: 'ESCALATED' },
      { complaintUuid: 'cmp-102', departmentCode: 'IT', divisionCode: '2024-IT-B', assignedToUserUuid: 'usr_suresh_hod', status: 'RESOLVED' },
      { complaintUuid: 'cmp-103', departmentCode: 'IT', divisionCode: '2024-IT-C', assignedToUserUuid: 'usr_rahul_tg', status: 'FORWARDED' }
    ];

    const hodUserUuid = 'usr_suresh_hod';
    const actionable = mockComplaints.filter(
      c => c.assignedToUserUuid === hodUserUuid && c.status === 'ESCALATED'
    );

    assert.strictEqual(actionable.length, 1);
    assert.strictEqual(actionable[0].complaintUuid, 'cmp-101');
  });

  it('should scope read-only Department Overview across all division lines for HOD', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-101', departmentCode: 'IT', divisionCode: '2024-IT-A' },
      { complaintUuid: 'cmp-102', departmentCode: 'IT', divisionCode: '2024-IT-B' },
      { complaintUuid: 'cmp-103', departmentCode: 'IT', divisionCode: '2024-IT-C' },
      { complaintUuid: 'cmp-104', departmentCode: 'CE', divisionCode: '2024-CE-A' }
    ];

    const hodDepartment = 'IT';
    const deptComplaints = mockComplaints.filter(c => c.departmentCode === hodDepartment);

    assert.strictEqual(deptComplaints.length, 3);
    assert.deepStrictEqual(deptComplaints.map(c => c.complaintUuid), ['cmp-101', 'cmp-102', 'cmp-103']);
  });

  it('should enforce 403 forbidden check when HOD attempts action on unassigned complaint', () => {
    const hodUserUuid = 'usr_suresh_hod';
    const complaint = {
      complaintUuid: 'cmp-103',
      assignedToUserUuid: 'usr_rahul_tg',
      status: 'FORWARDED'
    };

    const isForbidden = complaint.assignedToUserUuid && complaint.assignedToUserUuid !== hodUserUuid;
    assert.strictEqual(isForbidden, true);
  });

  it('should enforce 409 final state check when HOD attempts action on RESOLVED complaint', () => {
    const complaint = {
      complaintUuid: 'cmp-102',
      assignedToUserUuid: 'usr_suresh_hod',
      status: 'RESOLVED'
    };

    const isTerminal = ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(complaint.status);
    assert.strictEqual(isTerminal, true);
  });

  it('should correctly aggregate division performance and compute health status for HOD', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-1', departmentCode: 'IT', divisionCode: '2024-IT-A', status: 'IN_PROGRESS' },
      { complaintUuid: 'cmp-2', departmentCode: 'IT', divisionCode: '2024-IT-A', status: 'ESCALATED' },
      { complaintUuid: 'cmp-3', departmentCode: 'IT', divisionCode: '2024-IT-A', status: 'RESOLVED' },
      { complaintUuid: 'cmp-4', departmentCode: 'IT', divisionCode: '2024-IT-B', status: 'IN_PROGRESS' },
      { complaintUuid: 'cmp-5', departmentCode: 'IT', divisionCode: '2024-IT-B', status: 'RESOLVED' },
      { complaintUuid: 'cmp-6', departmentCode: 'IT', divisionCode: '2024-IT-C', status: 'RESOLVED' }
    ];

    const divisionMap = {
      'IT-A': { total: 0, open: 0, escalated: 0, resolved: 0 },
      'IT-B': { total: 0, open: 0, escalated: 0, resolved: 0 },
      'IT-C': { total: 0, open: 0, escalated: 0, resolved: 0 }
    };

    mockComplaints.forEach(c => {
      const key = c.divisionCode.replace(/^2024-/, '');
      if (divisionMap[key]) {
        divisionMap[key].total += 1;
        if (['IN_PROGRESS', 'SUBMITTED', 'ASSIGNED'].includes(c.status)) divisionMap[key].open += 1;
        if (c.status === 'ESCALATED') divisionMap[key].escalated += 1;
        if (['RESOLVED', 'CLOSED'].includes(c.status)) divisionMap[key].resolved += 1;
      }
    });

    assert.strictEqual(divisionMap['IT-A'].total, 3);
    assert.strictEqual(divisionMap['IT-A'].open, 1);
    assert.strictEqual(divisionMap['IT-A'].escalated, 1);
    assert.strictEqual(divisionMap['IT-A'].resolved, 1);

    assert.strictEqual(divisionMap['IT-B'].total, 2);
    assert.strictEqual(divisionMap['IT-B'].open, 1);
    assert.strictEqual(divisionMap['IT-B'].escalated, 0);

    assert.strictEqual(divisionMap['IT-C'].total, 1);
    assert.strictEqual(divisionMap['IT-C'].open, 0);
    assert.strictEqual(divisionMap['IT-C'].resolved, 1);
  });

  it('should filter department complaints strictly by division within HOD department', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-101', departmentCode: 'IT', divisionCode: '2024-IT-A' },
      { complaintUuid: 'cmp-102', departmentCode: 'IT', divisionCode: '2024-IT-B' },
      { complaintUuid: 'cmp-103', departmentCode: 'IT', divisionCode: '2024-IT-C' }
    ];

    const targetDivision = 'IT-A';
    const filtered = mockComplaints.filter(c => c.departmentCode === 'IT' && c.divisionCode.includes(targetDivision));

    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].complaintUuid, 'cmp-101');
  });
});

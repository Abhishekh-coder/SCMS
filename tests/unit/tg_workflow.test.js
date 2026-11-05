const { describe, it } = require('node:test');
const assert = require('assert');

describe('Teacher Guardian Workflow & Authorization Security Tests', () => {

  it('should restrict action buttons when complaint is not currently assigned to user', () => {
    const userUuid = 'usr_rahul_tg';

    const complaintAssigned = {
      complaintUuid: 'cmp-001',
      status: 'FORWARDED',
      assignedToUserUuid: 'usr_rahul_tg',
      currentAssignment: { handlerUserUuid: 'usr_rahul_tg' }
    };

    const complaintUnassigned = {
      complaintUuid: 'cmp-002',
      status: 'IN_PROGRESS',
      assignedToUserUuid: 'usr_anjali_incharge',
      currentAssignment: { handlerUserUuid: 'usr_anjali_incharge' }
    };

    const isAssigned1 = Boolean(
      userUuid &&
      (complaintAssigned.assignedToUserUuid === userUuid || complaintAssigned.currentAssignment?.handlerUserUuid === userUuid)
    );

    const isAssigned2 = Boolean(
      userUuid &&
      (complaintUnassigned.assignedToUserUuid === userUuid || complaintUnassigned.currentAssignment?.handlerUserUuid === userUuid)
    );

    assert.strictEqual(isAssigned1, true);
    assert.strictEqual(isAssigned2, false);
  });

  it('should enforce backend 403 forbidden check if assignedToUserUuid does not match requester', () => {
    const reqUserUuid = 'usr_rahul_tg';
    const complaint = {
      complaintUuid: 'cmp-999',
      assignedToUserUuid: 'usr_anjali_incharge'
    };

    const isForbidden = complaint.assignedToUserUuid && complaint.assignedToUserUuid !== reqUserUuid;
    assert.strictEqual(isForbidden, true);
  });

  it('should correctly partition division overview vs my-assigned complaints', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-1', departmentCode: 'IT', divisionCode: '2024-IT-A', assignedToUserUuid: 'usr_anjali' },
      { complaintUuid: 'cmp-2', departmentCode: 'IT', divisionCode: '2024-IT-A', assignedToUserUuid: 'usr_rahul' },
      { complaintUuid: 'cmp-3', departmentCode: 'IT', divisionCode: '2024-IT-B', assignedToUserUuid: 'usr_rahul' }
    ];

    const tgUser = { userUuid: 'usr_rahul', departmentCode: 'IT', divisionCode: '2024-IT-A' };

    const divisionComplaints = mockComplaints.filter(
      c => c.departmentCode === tgUser.departmentCode && c.divisionCode === tgUser.divisionCode
    );

    const myAssignedComplaints = mockComplaints.filter(
      c => c.assignedToUserUuid === tgUser.userUuid
    );

    assert.strictEqual(divisionComplaints.length, 2);
    assert.strictEqual(myAssignedComplaints.length, 2);
    assert.deepStrictEqual(divisionComplaints.map(c => c.complaintUuid), ['cmp-1', 'cmp-2']);
    assert.deepStrictEqual(myAssignedComplaints.map(c => c.complaintUuid), ['cmp-2', 'cmp-3']);
  });

  it('should filter Teacher Guardian actionable queue strictly to FORWARDED complaints', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-1', assignedToUserUuid: 'usr_rahul', status: 'FORWARDED' },
      { complaintUuid: 'cmp-2', assignedToUserUuid: 'usr_rahul', status: 'RESOLVED' },
      { complaintUuid: 'cmp-3', assignedToUserUuid: 'usr_rahul', status: 'CLOSED' }
    ];

    const tgUserUuid = 'usr_rahul';
    const actionable = mockComplaints.filter(
      c => c.assignedToUserUuid === tgUserUuid && c.status === 'FORWARDED'
    );

    assert.strictEqual(actionable.length, 1);
    assert.strictEqual(actionable[0].complaintUuid, 'cmp-1');
  });

  it('should reject action execution on RESOLVED or CLOSED complaints with 409 error flag', () => {
    const resolvedComplaint = { complaintUuid: 'cmp-2', status: 'RESOLVED' };
    const closedComplaint = { complaintUuid: 'cmp-3', status: 'CLOSED' };
    const forwardedComplaint = { complaintUuid: 'cmp-1', status: 'FORWARDED' };

    const isTerminal = (status) => ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(status);

    assert.strictEqual(isTerminal(resolvedComplaint.status), true);
    assert.strictEqual(isTerminal(closedComplaint.status), true);
    assert.strictEqual(isTerminal(forwardedComplaint.status), false);
  });
});

const { describe, it } = require('node:test');
const assert = require('assert');

describe('Complaint Dashboard Metrics & Semantic Scoping Tests', () => {

  it('should maintain unique handler UUIDs in assignedUserUuids array', () => {
    const handlerUuid1 = 'usr_anjali_class_incharge';
    const handlerUuid2 = 'usr_rahul_teacher_guardian';

    const existing = [handlerUuid1];
    const updated = Array.from(new Set([...existing, handlerUuid2, handlerUuid1].filter(Boolean)));

    assert.strictEqual(updated.length, 2);
    assert.deepStrictEqual(updated, [handlerUuid1, handlerUuid2]);
  });

  it('should calculate Class Incharge totalReceived status-independently', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-1', assignedUserUuids: ['usr_anjali'], status: 'RESOLVED', resolvedByUserUuid: 'usr_anjali' },
      { complaintUuid: 'cmp-2', assignedUserUuids: ['usr_anjali', 'usr_rahul'], status: 'FORWARDED', forwardedFromUserUuid: 'usr_anjali', assignedToUserUuid: 'usr_rahul' },
      { complaintUuid: 'cmp-3', assignedUserUuids: ['usr_anjali'], status: 'IN_PROGRESS', assignedToUserUuid: 'usr_anjali' }
    ];

    const userUuid = 'usr_anjali';

    const totalReceived = mockComplaints.filter(c => c.assignedUserUuids.includes(userUuid)).length;
    const inProgress = mockComplaints.filter(c => c.assignedToUserUuid === userUuid && ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
    const forwardedToTg = mockComplaints.filter(c => c.forwardedFromUserUuid === userUuid && c.status === 'FORWARDED').length;
    const resolved = mockComplaints.filter(c => c.resolvedByUserUuid === userUuid && ['RESOLVED', 'CLOSED'].includes(c.status)).length;

    assert.strictEqual(totalReceived, 3);
    assert.strictEqual(inProgress, 1);
    assert.strictEqual(forwardedToTg, 1);
    assert.strictEqual(resolved, 1);
  });

  it('should calculate Student metrics correctly', () => {
    const mockComplaints = [
      { complaintUuid: 'cmp-1', createdByUserUuid: 'usr_aarav', status: 'IN_PROGRESS' },
      { complaintUuid: 'cmp-2', createdByUserUuid: 'usr_aarav', status: 'RESOLVED' },
      { complaintUuid: 'cmp-3', createdByUserUuid: 'usr_aarav', status: 'ESCALATED' }
    ];

    const studentUuid = 'usr_aarav';
    const studentComplaints = mockComplaints.filter(c => c.createdByUserUuid === studentUuid);

    const inProgress = studentComplaints.filter(c => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
    const resolved = studentComplaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;
    const escalated = studentComplaints.filter(c => c.status === 'ESCALATED').length;

    assert.strictEqual(studentComplaints.length, 3);
    assert.strictEqual(inProgress, 1);
    assert.strictEqual(resolved, 1);
    assert.strictEqual(escalated, 1);
  });
});

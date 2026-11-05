const { describe, it } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');

const complaintAssignmentEngine = require('../../backend/src/domains/complaints/services/ComplaintAssignmentEngine');
const complaintAggregate = require('../../backend/src/domains/complaints/aggregate/ComplaintAggregate');
const workflowEngine = require('../../backend/src/domains/workflow/engine/workflowEngine');
const eventPublisher = require('../../backend/src/events/publishers/EventPublisher');
const {
  ComplaintSchema,
  ComplaintEventLedgerSchema,
  ComplaintCommentSchema,
  ComplaintSnapshotSchema
} = require('../../database/schema/complaintSchemas');

describe('Phase 3 - Complaint Lifecycle Engine & Aggregate Unit Tests', () => {
  const Complaint = mongoose.models.TestComplaint2 || mongoose.model('TestComplaint2', ComplaintSchema);
  const ComplaintEventLedger = mongoose.models.TestComplaintEventLedger2 || mongoose.model('TestComplaintEventLedger2', ComplaintEventLedgerSchema);
  const ComplaintComment = mongoose.models.TestComplaintComment2 || mongoose.model('TestComplaintComment2', ComplaintCommentSchema);
  const ComplaintSnapshot = mongoose.models.TestComplaintSnapshot2 || mongoose.model('TestComplaintSnapshot2', ComplaintSnapshotSchema);

  it('1. should validate ComplaintSchema with versioning, complaintCode format, and multi-tiered SLA timers', () => {
    const complaint = new Complaint({
      version: 1,
      complaintUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      complaintCode: 'CMP-2026-CSE-100201',
      title: 'Water Leakage in Hostel',
      description: 'Pipe leaking under sink',
      categoryCode: 'HOSTEL',
      subcategoryCode: 'MAINTENANCE',
      departmentCode: 'CSE',
      priority: 'HIGH',
      status: 'ASSIGNED',
      createdById: new mongoose.Types.ObjectId(),
      createdByUserUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      createdByName: 'Student User',
      slaHours: 24,
      slaTimers: {
        resolutionSlaDeadline: new Date(Date.now() + 86400000),
        slaWarningThreshold: new Date(Date.now() + 69120000),
        slaBreached: false
      }
    });

    assert.strictEqual(complaint.validateSync(), undefined);
    assert.strictEqual(complaint.version, 1);
    assert.strictEqual(complaint.complaintCode, 'CMP-2026-CSE-100201');
    assert.strictEqual(complaint.slaTimers.slaBreached, false);
  });

  it('2. should validate ComplaintEventLedgerSchema immutable event ledger entry', () => {
    const ledger = new ComplaintEventLedger({
      ledgerUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      complaintId: new mongoose.Types.ObjectId(),
      complaintUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      eventType: 'COMPLAINT_ASSIGNED',
      actorUuid: 'user_uuid_101',
      actorName: 'Dr. Suresh Kumar',
      previousState: 'SUBMITTED',
      newState: 'ASSIGNED',
      note: 'Auto-assigned based on CSE HOD mapping'
    });

    assert.strictEqual(ledger.validateSync(), undefined);
    assert.strictEqual(ledger.eventType, 'COMPLAINT_ASSIGNED');
  });

  it('3. should validate ComplaintCommentSchema comment types (PUBLIC, INTERNAL, SYSTEM)', () => {
    const publicComment = new ComplaintComment({
      commentUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      complaintId: new mongoose.Types.ObjectId(),
      complaintUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      authorUuid: 'user_101',
      authorName: 'HOD CSE',
      commentType: 'INTERNAL',
      message: 'Internal notes: Assigned technician plumber.'
    });

    assert.strictEqual(publicComment.validateSync(), undefined);
    assert.strictEqual(publicComment.commentType, 'INTERNAL');
  });

  it('4. should validate CQRS ComplaintSnapshotSchema for dashboard read queries', () => {
    const snapshot = new ComplaintSnapshot({
      tenantId: 'tenant_campus_01',
      complaintUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      complaintCode: 'CMP-2026-CSE-100201',
      title: 'Water Leakage',
      categoryCode: 'HOSTEL',
      departmentCode: 'CSE',
      priority: 'HIGH',
      status: 'ASSIGNED',
      createdByName: 'Student User',
      assignedToName: 'Dr. Suresh Kumar'
    });

    assert.strictEqual(snapshot.validateSync(), undefined);
    assert.strictEqual(snapshot.complaintCode, 'CMP-2026-CSE-100201');
  });
});

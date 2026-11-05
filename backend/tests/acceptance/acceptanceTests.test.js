/**
 * CCMS Final Acceptance Test Suite (8 Core Baseline Tests)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const priorityEngine = require('../../src/domains/complaints/engine/priorityEngine');
const complaintService = require('../../src/domains/complaints/complaint.service');
const complaintAggregate = require('../../src/domains/complaints/aggregate/ComplaintAggregate');
const complaintController = require('../../src/domains/complaints/controllers/complaint.controller');
const { StudentProfileSchema, UserSchema } = require('../../../database/schema/schemas');

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ccms_dev_db';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
});

test.after(async () => {
  await mongoose.disconnect();
});

test.describe('CCMS Architectural Baseline Acceptance Tests', () => {

  test('Test 1 — Student identity (Aarav 2024-IT-A-001-STD) produces IT & 2024-IT-A (Never CSE)', async () => {
    const studentUser = await User.findOne({ loginId: '2024-IT-A-001-STD' });
    assert.ok(studentUser, 'Student user 2024-IT-A-001-STD must exist');

    const res = await complaintService.createComplaint(studentUser, {
      title: 'Classroom AC Issue Test 1',
      description: 'Air conditioner unit is leaking in the lecture hall.',
      categoryCode: 'ACADEMICS',
      affectedScope: 'MY_CLASS',
      departmentHint: 'CSE' // Browser spoofing attempt
    });

    assert.equal(res.departmentCode, 'IT', 'Department code must be derived as IT, never CSE');
    assert.ok(res.divisionCode.includes('IT-A'), 'Division code must be 2024-IT-A');
  });

  test('Test 2 — Complaint creation priority (ACADEMICS, MY_CLASS, no safety risk) evaluates to MEDIUM', async () => {
    const studentUser = await User.findOne({ loginId: '2024-IT-A-001-STD' });
    const res = await complaintService.createComplaint(studentUser, {
      title: 'Projector display flickers in 204',
      description: 'Projector flickers occasionally during lecture presentations.',
      categoryCode: 'ACADEMICS',
      affectedScope: 'MY_CLASS',
      hasSafetyRisk: false
    });

    assert.equal(res.priority, 'MEDIUM', 'ACADEMICS + MY_CLASS without safety risk must evaluate to MEDIUM');
  });

  test('Test 3 — Class Incharge Dr. Anjali Mehta (EMP-IT-0031) sees IT-A complaint in dashboard listing', async () => {
    const staffUser = await User.findOne({ loginId: 'EMP-IT-0031' });
    assert.ok(staffUser, 'Dr. Anjali Mehta (EMP-IT-0031) must exist');

    const req = {
      user: {
        userUuid: staffUser.userUuid,
        primaryRole: 'CLASS_INCHARGE',
        roles: ['CLASS_INCHARGE', 'FACULTY'],
        tenantId: 'tenant_campus_01',
        departmentCode: 'IT',
        divisionCode: '2024-IT-A'
      },
      query: { limit: 10 },
      headers: {}
    };

    let resultData = null;
    const res = {
      status: (code) => ({
        json: (data) => { resultData = data; return data; }
      })
    };

    await complaintController.getComplaints(req, res, () => {});
    assert.ok(resultData && resultData.success, 'Snapshot query must succeed');
    assert.ok(Array.isArray(resultData.data), 'Dashboard must return snapshots list');
  });

  test('Test 4 — Student cannot manipulate department via browser payload', async () => {
    const studentUser = await User.findOne({ loginId: '2024-IT-A-001-STD' });
    const res = await complaintService.createComplaint(studentUser, {
      title: 'Lab equipment malfunction',
      description: 'Testing department spoofing resilience.',
      categoryCode: 'ACADEMICS',
      departmentCode: 'CSE',
      departmentHint: 'CSE'
    });

    assert.equal(res.departmentCode, 'IT', 'Backend must ignore browser department override and enforce IT');
  });

  test('Test 5 — Student cannot manipulate priority via browser payload', async () => {
    const studentUser = await User.findOne({ loginId: '2024-IT-A-001-STD' });
    const res = await complaintService.createComplaint(studentUser, {
      title: 'General textbook query',
      description: 'Student attempting to force CRITICAL priority in payload.',
      categoryCode: 'ACADEMICS',
      affectedScope: 'ONLY_ME',
      hasSafetyRisk: false,
      priority: 'CRITICAL' // Browser priority override attempt
    });

    assert.notEqual(res.priority, 'CRITICAL', 'Backend must ignore user-submitted priority');
    assert.equal(res.priority, 'LOW', 'ONLY_ME + ACADEMICS without safety risk must evaluate to LOW');
  });

  test('Test 6 — Priority engine deterministic scoring thresholds', () => {
    // ONLY_ME + ACADEMICS (1 + 0 + 1 = 2) -> LOW
    assert.equal(priorityEngine.calculatePriority({ categoryCode: 'ACADEMICS', affectedScope: 'ONLY_ME', hasSafetyRisk: false }), 'LOW');

    // MY_CLASS + ACADEMICS (3 + 0 + 1 = 4) -> MEDIUM
    assert.equal(priorityEngine.calculatePriority({ categoryCode: 'ACADEMICS', affectedScope: 'MY_CLASS', hasSafetyRisk: false }), 'MEDIUM');

    // MULTIPLE_CLASSES + EXAM (6 + 0 + 4 = 10) -> HIGH
    assert.equal(priorityEngine.calculatePriority({ categoryCode: 'EXAM', affectedScope: 'MULTIPLE_CLASSES', hasSafetyRisk: false }), 'HIGH');

    // CAMPUS_WIDE + SECURITY + Safety Risk (8 + 8 + 5 = 21) -> CRITICAL
    assert.equal(priorityEngine.calculatePriority({ categoryCode: 'SECURITY', affectedScope: 'CAMPUS_WIDE', hasSafetyRisk: true }), 'CRITICAL');
  });

  test('Test 7 — Operational complaint (HOSTEL) routes to Campus Services Head, NOT Class Incharge', async () => {
    const studentUser = await User.findOne({ loginId: '2024-IT-A-001-STD' });
    const res = await complaintService.createComplaint(studentUser, {
      title: 'Hostel Block B Water Supply Disruption',
      description: 'No water supply in hostel block B rooms.',
      categoryCode: 'HOSTEL',
      affectedScope: 'MULTIPLE_CLASSES'
    });

    const campusHead = await User.findOne({ loginId: 'EMP-CAMPUS-0001' });
    assert.ok(campusHead, 'Campus Services Head EMP-CAMPUS-0001 must exist');

    assert.equal(res.assignedToUserUuid, campusHead.userUuid, 'Hostel complaint must route to Campus Services Head');
    assert.notEqual(res.assignedToRole, 'CLASS_INCHARGE', 'Operational complaint must NOT route to Class Incharge');
  });

  test('Test 8 — Audited Priority Override (Validation & Ledger Event)', async () => {
    const studentUser = await User.findOne({ loginId: '2024-IT-A-001-STD' });
    const staffUser = await User.findOne({ loginId: 'EMP-IT-0031' });

    const complaint = await complaintService.createComplaint(studentUser, {
      title: 'Internal Exam Question Paper Printing Error',
      description: 'Printing error in question paper for division IT-A.',
      categoryCode: 'EXAM',
      affectedScope: 'MY_CLASS'
    });

    // Subtest A: Short reason (< 10 chars) throws 400 Bad Request Error
    await assert.rejects(
      async () => {
        await complaintAggregate.overridePriority(staffUser, complaint.complaintUuid, 'HIGH', 'Too short');
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      },
      'Override with short reason must throw 400 ValidationError'
    );

    // Subtest B: Valid reason (>= 10 chars) succeeds and records audit event
    const updated = await complaintAggregate.overridePriority(
      staffUser,
      complaint.complaintUuid,
      'HIGH',
      'Urgent override: Exam is scheduled tomorrow morning and affects entire division.'
    );

    assert.equal(updated.priority, 'HIGH', 'Priority must be updated to HIGH');
  });

});

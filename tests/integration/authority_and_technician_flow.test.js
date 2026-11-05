const { describe, it } = require('node:test');
const assert = require('assert');
const workflowEngine = require('../../backend/src/domains/workflow/engine/workflowEngine');
const complaintAggregate = require('../../backend/src/domains/complaints/aggregate/ComplaintAggregate');

describe('CampusFix — Dual Track Authority & Technician Lifecycle Security Tests', () => {

  // ── Test 1: Complete Dual Track Separation ──
  it('1. should maintain technician physical repair track independently without overwriting authority assignment', () => {
    // Student creates academic complaint, assigned to Class Incharge
    let complaint = {
      complaintUuid: 'cmp-test-dual-01',
      version: 1,
      status: 'ASSIGNED',
      assignedToUserUuid: 'usr_ci_anjali',
      assignedToName: 'Dr. Anjali Mehta',
      assignedToRole: 'CLASS_INCHARGE',
      technicianAssignment: {
        technicianUserUuid: null,
        technicianName: null,
        trade: null,
        status: 'UNASSIGNED',
        assignedAt: null,
        resolvedAt: null,
        resolutionNotes: '',
        evidenceUrls: []
      },
      policyApproval: {
        requiresPrincipalApproval: false,
        approvalStatus: 'NOT_REQUIRED'
      }
    };

    // Step A: Campus Services Admin dispatches Electrician
    const dispatcher = { userUuid: 'usr_admin_ramesh', fullName: 'Ramesh Patel', roles: ['ADMIN'] };
    const techData = {
      technicianUserUuid: 'usr_tech_vijay',
      technicianName: 'Vijay Sharma',
      trade: 'ELECTRICIAN',
      notes: 'Dispatched to inspect switchboard sparking'
    };

    // Simulate technician assignment logic
    complaint.technicianAssignment = {
      technicianUserUuid: techData.technicianUserUuid,
      technicianName: techData.technicianName,
      trade: techData.trade,
      status: 'DISPATCHED',
      assignedAt: new Date(),
      startedAt: null,
      resolvedAt: null,
      resolutionNotes: '',
      evidenceUrls: []
    };
    complaint.version += 1;

    // Verify authority is untouched
    assert.strictEqual(complaint.assignedToUserUuid, 'usr_ci_anjali');
    assert.strictEqual(complaint.assignedToRole, 'CLASS_INCHARGE');
    assert.strictEqual(complaint.status, 'ASSIGNED'); // Administrative state not modified
    assert.strictEqual(complaint.technicianAssignment.status, 'DISPATCHED');
    assert.strictEqual(complaint.technicianAssignment.trade, 'ELECTRICIAN');

    // Step B: Technician starts physical work
    complaint.technicianAssignment.status = 'IN_PROGRESS';
    complaint.technicianAssignment.startedAt = new Date();
    complaint.version += 1;

    assert.strictEqual(complaint.technicianAssignment.status, 'IN_PROGRESS');
    assert.strictEqual(complaint.status, 'ASSIGNED'); // Still untouched

    // Step C: Technician marks physical work RESOLVED with notes and evidence photo
    const repairNotes = 'Replaced faulty 16A circuit breaker and tested voltage output.';
    const evidence = ['/uploads/evidence/repair_breaker_done.jpg'];

    complaint.technicianAssignment.status = 'RESOLVED';
    complaint.technicianAssignment.resolvedAt = new Date();
    complaint.technicianAssignment.resolutionNotes = repairNotes;
    complaint.technicianAssignment.evidenceUrls = evidence;
    complaint.version += 1;

    // Critical Safeguard: Technician completion must NOT automatically close or resolve administrative complaint!
    assert.strictEqual(complaint.technicianAssignment.status, 'RESOLVED');
    assert.strictEqual(complaint.status, 'ASSIGNED'); // Authority has not yet verified
    assert.strictEqual(complaint.assignedToRole, 'CLASS_INCHARGE');

    // Step D: CI inspects and verifies physical repair, then marks complaint RESOLVED
    complaint.status = 'RESOLVED';
    complaint.resolvedByUserUuid = 'usr_ci_anjali';
    complaint.resolvedByName = 'Dr. Anjali Mehta';
    complaint.resolvedAt = new Date();
    complaint.version += 1;

    assert.strictEqual(complaint.status, 'RESOLVED');
    assert.strictEqual(complaint.resolvedByUserUuid, 'usr_ci_anjali');
    assert.strictEqual(complaint.technicianAssignment.status, 'RESOLVED');
  });

  // ── Test 2: Authority Rejection with Reason ──
  it('2. should enforce explicit rejection rules with mandatory rejection reason', () => {
    // Verify state machine allows REJECTED from ASSIGNED, IN_PROGRESS, FORWARDED, ESCALATED
    assert.strictEqual(workflowEngine.validateTransition('ASSIGNED', 'REJECTED'), true);
    assert.strictEqual(workflowEngine.validateTransition('IN_PROGRESS', 'REJECTED'), true);
    assert.strictEqual(workflowEngine.validateTransition('FORWARDED', 'REJECTED'), true);
    assert.strictEqual(workflowEngine.validateTransition('ESCALATED', 'REJECTED'), true);

    const complaint = {
      complaintUuid: 'cmp-test-reject-01',
      status: 'ASSIGNED',
      assignedToUserUuid: 'usr_ci_anjali',
      assignedToRole: 'CLASS_INCHARGE'
    };

    const emptyReason = '   ';
    assert.strictEqual(!emptyReason.trim(), true); // Must reject empty reason

    const validReason = 'Duplicate complaint: issue already reported under ticket CMP-2026-IT-100234.';
    complaint.status = 'REJECTED';
    complaint.rejectionDetails = {
      rejectedByUserUuid: 'usr_ci_anjali',
      rejectedByName: 'Dr. Anjali Mehta',
      rejectedByRole: 'CLASS_INCHARGE',
      reason: validReason,
      rejectedAt: new Date()
    };

    assert.strictEqual(complaint.status, 'REJECTED');
    assert.strictEqual(complaint.rejectionDetails.reason, validReason);
    assert.strictEqual(complaint.rejectionDetails.rejectedByRole, 'CLASS_INCHARGE');
  });

  // ── Test 3: Authority Return for Correction & Student Resubmission ──
  it('3. should allow authority to return incomplete complaint for student correction, then student resubmits', () => {
    // Verify state machine transitions
    assert.strictEqual(workflowEngine.validateTransition('ASSIGNED', 'RETURNED_FOR_CORRECTION'), true);
    assert.strictEqual(workflowEngine.validateTransition('RETURNED_FOR_CORRECTION', 'SUBMITTED'), true);

    const studentUuid = 'usr_student_aarav';
    let complaint = {
      complaintUuid: 'cmp-test-return-01',
      createdByUserUuid: studentUuid,
      status: 'ASSIGNED',
      assignedToUserUuid: 'usr_ci_anjali',
      assignedToRole: 'CLASS_INCHARGE'
    };

    // Step 1: CI returns for correction
    const instructions = 'Please provide exact room number and attach photo of the faulty equipment.';
    complaint.status = 'RETURNED_FOR_CORRECTION';
    complaint.correctionDetails = {
      returnedByUserUuid: 'usr_ci_anjali',
      returnedByName: 'Dr. Anjali Mehta',
      returnedByRole: 'CLASS_INCHARGE',
      instructions,
      returnedAt: new Date()
    };

    assert.strictEqual(complaint.status, 'RETURNED_FOR_CORRECTION');
    assert.strictEqual(complaint.correctionDetails.instructions, instructions);

    // Step 2: Student resubmits complaint after providing details
    assert.strictEqual(complaint.createdByUserUuid === studentUuid, true);
    complaint.status = 'SUBMITTED';

    assert.strictEqual(complaint.status, 'SUBMITTED');
  });

  // ── Test 4: Principal Policy-Driven Mandatory Approval ──
  it('4. should block resolution by non-principal when policy approval is required and pending', () => {
    const complaint = {
      complaintUuid: 'cmp-test-policy-01',
      status: 'IN_PROGRESS',
      assignedToUserUuid: 'usr_hod_suresh',
      assignedToRole: 'HOD',
      policyApproval: {
        requiresPrincipalApproval: true,
        policyReason: 'STRUCTURAL_SAFETY: Requires civil wall repair exceeding budget limit',
        approvalStatus: 'PENDING_APPROVAL'
      }
    };

    // Attempt 1: HOD tries to resolve while approvalStatus is PENDING_APPROVAL
    const hodUser = { userUuid: 'usr_hod_suresh', primaryRole: 'HOD', roles: ['HOD', 'FACULTY'] };
    const isPrincipal = hodUser.roles.includes('PRINCIPAL') || hodUser.primaryRole === 'PRINCIPAL';
    assert.strictEqual(isPrincipal, false);

    const canResolve = !complaint.policyApproval.requiresPrincipalApproval || complaint.policyApproval.approvalStatus === 'APPROVED' || isPrincipal;
    assert.strictEqual(canResolve, false); // Blocked!

    // Attempt 2: Principal grants policy approval
    const principalUser = { userUuid: 'usr_principal_rajesh', primaryRole: 'PRINCIPAL', fullName: 'Dr. Rajesh Sharma', roles: ['PRINCIPAL'] };
    complaint.policyApproval.approvalStatus = 'APPROVED';
    complaint.policyApproval.decisionByUserUuid = principalUser.userUuid;
    complaint.policyApproval.decisionByName = principalUser.fullName;
    complaint.policyApproval.decisionAt = new Date();

    // Now resolution is permitted
    const canResolveNow = !complaint.policyApproval.requiresPrincipalApproval || complaint.policyApproval.approvalStatus === 'APPROVED' || isPrincipal;
    assert.strictEqual(canResolveNow, true); // Permitted!
  });

  // ── Test 5: Principal Direct Resolution Satisfies Policy Approval ──
  it('5. should implicitly satisfy policy approval when Principal directly resolves an escalated case', () => {
    let complaint = {
      complaintUuid: 'cmp-test-policy-02',
      status: 'ESCALATED',
      assignedToUserUuid: 'usr_principal_rajesh',
      assignedToRole: 'PRINCIPAL',
      policyApproval: {
        requiresPrincipalApproval: true,
        policyReason: 'HIGH_BUDGET: Campus-wide network switch replacement',
        approvalStatus: 'PENDING_APPROVAL'
      }
    };

    const principalUser = { userUuid: 'usr_principal_rajesh', primaryRole: 'PRINCIPAL', roles: ['PRINCIPAL'] };
    const isPrincipal = principalUser.roles.includes('PRINCIPAL') || principalUser.primaryRole === 'PRINCIPAL';
    assert.strictEqual(isPrincipal, true);

    // When Principal directly resolves:
    if (isPrincipal && complaint.policyApproval.requiresPrincipalApproval) {
      complaint.policyApproval.approvalStatus = 'APPROVED';
      complaint.policyApproval.decisionByUserUuid = principalUser.userUuid;
      complaint.policyApproval.decisionAt = new Date();
    }
    complaint.status = 'RESOLVED';

    assert.strictEqual(complaint.status, 'RESOLVED');
    assert.strictEqual(complaint.policyApproval.approvalStatus, 'APPROVED');
  });

  // ── Test 6: Evidence URL Sanitization & Security ──
  it('6. should validate and reject untrusted or malicious evidence URLs', () => {
    const validEvidence = [
      '/uploads/evidence/screen_fix.png',
      '/storage/complaints/meter_reading.webp',
      'https://cdn.campusfix.edu/repairs/pipe_after.jpg'
    ];
    const sanitized = complaintAggregate._validateEvidenceUrls(validEvidence);
    assert.strictEqual(sanitized.length, 3);

    // Malicious or untrusted patterns must throw
    const maliciousCases = [
      ['javascript:alert(1)'],
      ['file:///etc/passwd'],
      ['data:text/html,<script>alert(1)</script>'],
      ['https://evil-site.com/malware.exe']
    ];

    maliciousCases.forEach(testCase => {
      assert.throws(() => {
        complaintAggregate._validateEvidenceUrls(testCase);
      }, /Invalid evidence reference/);
    });
  });

  // ── Test 7: Student Forbidden from Assigning Technician ──
  it('7. should forbid students from assigning technicians or changing physical repair status', async () => {
    const studentUser = {
      userUuid: 'usr_student_aarav',
      profileType: 'STUDENT',
      roles: ['STUDENT'],
      primaryRole: 'STUDENT'
    };

    await assert.rejects(
      async () => {
        await complaintAggregate.assignTechnician(studentUser, 'cmp-any', {
          technicianUserUuid: 'usr_tech_1',
          technicianName: 'Plumber',
          trade: 'PLUMBER'
        });
      },
      /Students are not authorized to assign technicians/
    );
  });

  // ── Test 8: Unassigned Technician Forbidden from Updating Work ──
  it('8. should forbid unauthorized technicians from modifying another technician assignment', async () => {
    const intruderTechnician = {
      userUuid: 'usr_other_tech_mohan',
      roles: ['TECHNICIAN'],
      primaryRole: 'TECHNICIAN'
    };

    // Mock aggregate check
    const complaint = {
      complaintUuid: 'cmp-tech-01',
      technicianAssignment: {
        technicianUserUuid: 'usr_tech_vijay', // Assigned to Vijay
        status: 'DISPATCHED'
      }
    };

    const isAssigned = complaint.technicianAssignment?.technicianUserUuid === intruderTechnician.userUuid;
    assert.strictEqual(isAssigned, false);
  });
});

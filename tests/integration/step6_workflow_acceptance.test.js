const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const crypto = require('crypto');

const complaintAggregate = require('../../backend/src/domains/complaints/aggregate/ComplaintAggregate');
const complaintController = require('../../backend/src/domains/complaints/controllers/complaint.controller');
const storageService = require('../../backend/src/infrastructure/storage/StorageService');
const workflowEngine = require('../../backend/src/domains/workflow/engine/workflowEngine');

const {
  ComplaintSchema,
  ComplaintSnapshotSchema,
  ComplaintCommentSchema,
  ComplaintAttachmentSchema,
  ComplaintEventLedgerSchema
} = require('../../database/schema/complaintSchemas');

const {
  UserSchema,
  FacultyProfileSchema,
  StudentProfileSchema,
  OrganizationalAssignmentSchema
} = require('../../database/schema/schemas');

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
const ComplaintSnapshot = mongoose.models.ComplaintSnapshot || mongoose.model('ComplaintSnapshot', ComplaintSnapshotSchema);
const ComplaintComment = mongoose.models.ComplaintComment || mongoose.model('ComplaintComment', ComplaintCommentSchema);
const ComplaintAttachment = mongoose.models.ComplaintAttachment || mongoose.model('ComplaintAttachment', ComplaintAttachmentSchema);
const ComplaintEventLedger = mongoose.models.ComplaintEventLedger || mongoose.model('ComplaintEventLedger', ComplaintEventLedgerSchema);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile', FacultyProfileSchema);
const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment', OrganizationalAssignmentSchema);

const ACCEPTANCE_DB_URI = process.env.ACCEPTANCE_DB_URI || 'mongodb://127.0.0.1:27017/ccms_step6_acceptance_db';

describe('CampusFix Step 6 — Workflow Acceptance Testing Suite', () => {
  // Synthetic Persona Definitions
  const student = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_student_aarav',
    fullName: 'Aarav Mehta (Student)',
    email: 'aarav.mehta@campus.edu',
    roles: ['STUDENT'],
    primaryRole: 'STUDENT',
    profileType: 'STUDENT',
    departmentCode: 'IT',
    divisionCode: '2024-IT-A',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  const studentOther = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_student_rohan',
    fullName: 'Rohan Verma (Student)',
    email: 'rohan.verma@campus.edu',
    roles: ['STUDENT'],
    primaryRole: 'STUDENT',
    profileType: 'STUDENT',
    departmentCode: 'IT',
    divisionCode: '2024-IT-A',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  const ci = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_ci_anjali',
    fullName: 'Dr. Anjali Deshmukh (CI)',
    email: 'anjali.ci@campus.edu',
    roles: ['FACULTY'],
    primaryRole: 'FACULTY',
    profileType: 'FACULTY',
    departmentCode: 'IT',
    divisionCode: '2024-IT-A',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  const tg = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_tg_vikram',
    fullName: 'Prof. Vikram Joshi (TG)',
    email: 'vikram.tg@campus.edu',
    roles: ['FACULTY'],
    primaryRole: 'FACULTY',
    profileType: 'FACULTY',
    departmentCode: 'IT',
    divisionCode: '2024-IT-A',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  const hod = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_hod_kulkarni',
    fullName: 'Dr. Sneha Kulkarni (HOD)',
    email: 'hod.it@campus.edu',
    roles: ['HOD'],
    primaryRole: 'HOD',
    profileType: 'FACULTY',
    departmentCode: 'IT',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  const dean = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_dean_verma',
    fullName: 'Dr. Arvind Verma (Dean)',
    email: 'dean.academics@campus.edu',
    roles: ['DEAN'],
    primaryRole: 'DEAN',
    profileType: 'FACULTY',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  const principal = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_principal_sharma',
    fullName: 'Dr. Rajesh Sharma (Principal)',
    email: 'principal@campus.edu',
    roles: ['PRINCIPAL'],
    primaryRole: 'PRINCIPAL',
    profileType: 'ADMIN',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  const campusHead = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_campus_head_patel',
    fullName: 'Ramesh Patel (Campus Services Head)',
    email: 'ramesh.services@campus.edu',
    roles: ['ADMIN'],
    primaryRole: 'ADMIN',
    profileType: 'ADMIN',
    departmentCode: 'CAMPUS_SERVICES',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  const technicianVijay = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_tech_vijay',
    fullName: 'Vijay Sharma (Electrician)',
    email: 'vijay.tech@campus.edu',
    roles: ['ADMIN'],
    primaryRole: 'ADMIN',
    profileType: 'ADMIN',
    trade: 'ELECTRICIAN',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  const technicianOther = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: 'usr_step6_tech_raj',
    fullName: 'Raj Kumar (Plumber)',
    email: 'raj.tech@campus.edu',
    roles: ['FACULTY'],
    primaryRole: 'FACULTY',
    profileType: 'FACULTY',
    trade: 'PLUMBER',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  before(async () => {
    process.env.NODE_ENV = 'test';
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(ACCEPTANCE_DB_URI);

    // Clean test database
    await Promise.all([
      Complaint.deleteMany({}),
      ComplaintSnapshot.deleteMany({}),
      ComplaintEventLedger.deleteMany({}),
      ComplaintComment.deleteMany({}),
      ComplaintAttachment.deleteMany({}),
      User.deleteMany({}),
      FacultyProfile.deleteMany({}),
      StudentProfile.deleteMany({}),
      OrganizationalAssignment.deleteMany({})
    ]);

    // Seed test personas into User collection
    const personas = [student, studentOther, ci, tg, hod, dean, principal, campusHead, technicianVijay, technicianOther];
    for (const p of personas) {
      await User.create({
        _id: p._id,
        userUuid: p.userUuid,
        loginId: `LOGIN-${p.userUuid}`,
        email: p.email,
        passwordHash: 'hashed_password_for_step6',
        fullName: p.fullName,
        accountStatus: 'ACTIVE',
        profileType: p.profileType,
        roles: p.roles,
        primaryRole: p.primaryRole,
        tenantId: p.tenantId,
        campusId: p.campusId
      });

      if (['FACULTY', 'ADMIN'].includes(p.profileType)) {
        await FacultyProfile.create({
          userId: p._id,
          loginId: `LOGIN-${p.userUuid}`,
          employeeCode: `EMP-${p.userUuid.slice(-6).toUpperCase()}`,
          department: p.departmentCode || 'IT',
          designation: 'PROFESSOR',
          fullName: p.fullName
        });
      }
    }

    // Seed Organizational Assignments for Workflow Ladder
    await OrganizationalAssignment.create([
      {
        scopeType: 'DIVISION',
        scopeId: '2024-IT-A',
        assignmentType: 'CLASS_INCHARGE',
        assigneeUserId: ci._id,
        assigneeLoginId: `LOGIN-${ci.userUuid}`,
        assigneeUserUuid: ci.userUuid,
        effectiveFrom: new Date(),
        assignedBy: principal._id,
        isActive: true
      },
      {
        scopeType: 'DIVISION',
        scopeId: '2024-IT-A',
        assignmentType: 'TEACHER_GUARDIAN',
        assigneeUserId: tg._id,
        assigneeLoginId: `LOGIN-${tg.userUuid}`,
        assigneeUserUuid: tg.userUuid,
        effectiveFrom: new Date(),
        assignedBy: principal._id,
        isActive: true
      },
      {
        scopeType: 'DEPARTMENT',
        scopeId: 'IT',
        assignmentType: 'HOD',
        assigneeUserId: hod._id,
        assigneeLoginId: `LOGIN-${hod.userUuid}`,
        assigneeUserUuid: hod.userUuid,
        effectiveFrom: new Date(),
        assignedBy: principal._id,
        isActive: true
      },
      {
        scopeType: 'ACADEMIC',
        scopeId: 'ACADEMICS',
        assignmentType: 'DEAN',
        assigneeUserId: dean._id,
        assigneeLoginId: `LOGIN-${dean.userUuid}`,
        assigneeUserUuid: dean.userUuid,
        effectiveFrom: new Date(),
        assignedBy: principal._id,
        isActive: true
      },
      {
        scopeType: 'INSTITUTION',
        scopeId: 'MAIN_CAMPUS',
        assignmentType: 'PRINCIPAL',
        assigneeUserId: principal._id,
        assigneeLoginId: `LOGIN-${principal.userUuid}`,
        assigneeUserUuid: principal.userUuid,
        effectiveFrom: new Date(),
        assignedBy: principal._id,
        isActive: true
      },
      {
        scopeType: 'DEPARTMENT',
        scopeId: 'CAMPUS_SERVICES',
        assignmentType: 'CAMPUS_SERVICES_HEAD',
        assigneeUserId: campusHead._id,
        assigneeLoginId: `LOGIN-${campusHead.userUuid}`,
        assigneeUserUuid: campusHead.userUuid,
        effectiveFrom: new Date(),
        assignedBy: principal._id,
        isActive: true
      }
    ]);
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  // ══════════════════════════════════════════════════════════════════
  describe('Phase 2 — Academic Complaint Lifecycle: Student → CI → TG → HOD → Dean → Principal', () => {
    let academicComplaintUuid;
    let academicDoc;

    it('1. Student submits academic complaint; resolves CI assignment, initial version, and event ledger', async () => {
      const created = await complaintAggregate.submitComplaint(student, {
        title: 'Projector in IT Room 301 Flickering',
        description: 'The overhead projector flickers constantly during Operating Systems lecture.',
        categoryCode: 'ACADEMIC',
        subcategoryCode: 'LECTURE',
        priority: 'MEDIUM',
        departmentHint: 'IT',
        divisionCode: '2024-IT-A',
        location: { buildingCode: 'MAIN_BLOCK', roomCode: 'ROOM_301' }
      });

      assert.ok(created.complaintUuid);
      assert.strictEqual(created.createdByUserUuid, student.userUuid);
      assert.strictEqual(created.version, 1);
      assert.strictEqual(created.status, 'ASSIGNED');
      assert.strictEqual(created.assignedToRole, 'CLASS_INCHARGE');
      assert.strictEqual(created.assignedToUserUuid, ci.userUuid);
      assert.strictEqual(created.domainType, 'ACADEMIC');

      academicComplaintUuid = created.complaintUuid;
      academicDoc = created;

      // Verify Snapshot Sync
      const snapshot = await ComplaintSnapshot.findOne({ complaintUuid: academicComplaintUuid });
      assert.strictEqual(snapshot.status, 'ASSIGNED');
      assert.strictEqual(snapshot.assignedToUserUuid, ci.userUuid);

      // Verify Event Ledger
      const ledger = await ComplaintEventLedger.find({ complaintUuid: academicComplaintUuid }).sort({ timestamp: 1 });
      assert.ok(ledger.length >= 2);
      const eventTypes = ledger.map(l => l.eventType);
      assert.ok(eventTypes.includes('COMPLAINT_SUBMITTED'));
      assert.ok(eventTypes.includes('COMPLAINT_ASSIGNED'));
    });

    it('2. Unauthorized user cannot perform actions on complaint (403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.executeAction(
            tg, // TG is not current assigned handler (CI is assigned)
            academicComplaintUuid,
            'FORWARD',
            'Unauthorized review attempt by TG',
            academicDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('3. Class Incharge reviews and forwards to Teacher Guide with version increment and ledger entry', async () => {
      const forwarded = await complaintAggregate.executeAction(
        ci,
        academicComplaintUuid,
        'FORWARD',
        'Forwarded to Teacher Guide for division-level guidance review',
        academicDoc.version
      );

      assert.strictEqual(forwarded.status, 'FORWARDED');
      assert.strictEqual(forwarded.version, 2);
      assert.strictEqual(forwarded.assignedToUserUuid, tg.userUuid);
      assert.strictEqual(forwarded.assignedToRole, 'TEACHER_GUARDIAN');
      assert.ok(forwarded.assignedUserUuids.includes(tg.userUuid));

      academicDoc = forwarded;

      // Verify Event Ledger
      const events = await ComplaintEventLedger.find({ complaintUuid: academicComplaintUuid }).sort({ timestamp: 1 });
      const lastEvent = events[events.length - 1];
      assert.strictEqual(lastEvent.eventType, 'COMPLAINT_FORWARDED');
      assert.strictEqual(lastEvent.actorUuid, ci.userUuid);
      assert.strictEqual(lastEvent.previousState, 'ASSIGNED');
      assert.strictEqual(lastEvent.newState, 'FORWARDED');
    });

    it('4. Teacher Guide escalates complaint to HOD with version increment and assignment history', async () => {
      const escalatedHod = await complaintAggregate.executeAction(
        tg,
        academicComplaintUuid,
        'ESCALATE',
        'Escalated to HOD for lab projector procurement and hardware check',
        academicDoc.version
      );

      assert.strictEqual(escalatedHod.status, 'ESCALATED');
      assert.strictEqual(escalatedHod.version, 3);
      assert.strictEqual(escalatedHod.assignedToUserUuid, hod.userUuid);
      assert.strictEqual(escalatedHod.assignedToRole, 'HOD');

      academicDoc = escalatedHod;

      const events = await ComplaintEventLedger.find({ complaintUuid: academicComplaintUuid }).sort({ timestamp: 1 });
      const lastEvent = events[events.length - 1];
      assert.strictEqual(lastEvent.eventType, 'COMPLAINT_ESCALATED');
      assert.strictEqual(lastEvent.actorUuid, tg.userUuid);
    });

    it('5. HOD escalates complaint to Dean', async () => {
      const escalatedDean = await complaintAggregate.executeAction(
        hod,
        academicComplaintUuid,
        'ESCALATE',
        'Escalated to Dean for faculty department equipment clearance',
        academicDoc.version
      );

      assert.strictEqual(escalatedDean.status, 'ESCALATED');
      assert.strictEqual(escalatedDean.version, 4);
      assert.strictEqual(escalatedDean.assignedToUserUuid, dean.userUuid);
      assert.strictEqual(escalatedDean.assignedToRole, 'DEAN');

      academicDoc = escalatedDean;
    });

    it('6. Dean escalates complaint to Principal', async () => {
      const escalatedPrincipal = await complaintAggregate.executeAction(
        dean,
        academicComplaintUuid,
        'ESCALATE',
        'Escalated to Principal for executive academic institutional oversight',
        academicDoc.version
      );

      assert.strictEqual(escalatedPrincipal.status, 'ESCALATED');
      assert.strictEqual(escalatedPrincipal.version, 5);
      assert.strictEqual(escalatedPrincipal.assignedToUserUuid, principal.userUuid);
      assert.strictEqual(escalatedPrincipal.assignedToRole, 'PRINCIPAL');

      academicDoc = escalatedPrincipal;
    });

    it('7. Principal is the terminal authority; rejecting further escalation beyond Principal (400)', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.executeAction(
            principal,
            academicComplaintUuid,
            'ESCALATE',
            'Attempting to escalate beyond terminal authority',
            academicDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'TERMINAL_ESCALATION_LEVEL');
          return true;
        }
      );
    });

    it('8. Principal resolves complaint; marks status RESOLVED with resolution details and complete ledger', async () => {
      const resolutionNote = 'New ultra-short-throw laser projector approved and installed in Room 301.';
      const resolved = await complaintAggregate.executeAction(
        principal,
        academicComplaintUuid,
        'RESOLVE',
        resolutionNote,
        academicDoc.version
      );

      assert.strictEqual(resolved.status, 'RESOLVED');
      assert.strictEqual(resolved.version, 6);
      assert.strictEqual(resolved.resolvedByUserUuid, principal.userUuid);
      assert.strictEqual(resolved.resolvedByName, principal.fullName);
      assert.ok(resolved.resolvedAt);

      academicDoc = resolved;

      // Verify complete immutable event ledger integrity
      const ledger = await ComplaintEventLedger.find({ complaintUuid: academicComplaintUuid }).sort({ timestamp: 1 });
      const lastEvent = ledger[ledger.length - 1];
      assert.strictEqual(lastEvent.eventType, 'COMPLAINT_RESOLVED');
      assert.strictEqual(lastEvent.actorUuid, principal.userUuid);
      assert.strictEqual(lastEvent.note, resolutionNote);
    });

    it('9. Student accepts resolution; complaint transitions to terminal CLOSED state', async () => {
      const closed = await complaintAggregate.executeAction(
        student,
        academicComplaintUuid,
        'CLOSE',
        'Verified projector is working properly in Room 301. Thank you!',
        academicDoc.version
      );

      assert.strictEqual(closed.status, 'CLOSED');
      assert.strictEqual(closed.version, 7);
      assert.ok(closed.closedAt);

      academicDoc = closed;

      // Verify no further transitions can occur from terminal CLOSED state
      await assert.rejects(
        async () => {
          await complaintAggregate.executeAction(
            principal,
            academicComplaintUuid,
            'RESOLVE',
            'Attempting mutation on closed complaint',
            academicDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 3 — OPERATIONAL & TECHNICIAN WORKFLOW ACCEPTANCE
  // ═════════════════════════════════════════════════════════════════════
  describe('Phase 3 — Operational Domain & Technician Dual-Track Workflow', () => {
    let opComplaintUuid;
    let opDoc;

    it('1. Operational complaint routes to Campus Services Head authority', async () => {
      const created = await complaintAggregate.submitComplaint(student, {
        title: 'Water Pipe Burst in Mechanical Block Basement',
        description: 'Main waterline burst causing flooding in Workshop B-04.',
        categoryCode: 'FACILITIES',
        subcategoryCode: 'PLUMBING',
        priority: 'CRITICAL',
        departmentHint: 'CAMPUS_SERVICES',
        location: { buildingCode: 'MECH_BLOCK', roomCode: 'WORKSHOP_B04' }
      });

      assert.strictEqual(created.status, 'ASSIGNED');
      assert.strictEqual(created.assignedToUserUuid, campusHead.userUuid);
      assert.strictEqual(created.assignedToRole, 'CAMPUS_SERVICES_HEAD');
      assert.strictEqual(created.version, 1);

      opComplaintUuid = created.complaintUuid;
      opDoc = created;
    });

    it('2. Campus Admin dispatches Technician Vijay without overwriting administrative authority assignment', async () => {
      const updated = await complaintAggregate.assignTechnician(
        campusHead,
        opComplaintUuid,
        {
          technicianUserUuid: technicianVijay.userUuid,
          technicianName: technicianVijay.fullName,
          trade: 'PLUMBER',
          notes: 'Dispatched for emergency valve replacement'
        },
        opDoc.version
      );

      // Verify technician assignment is independent
      assert.strictEqual(updated.technicianAssignment.technicianUserUuid, technicianVijay.userUuid);
      assert.strictEqual(updated.technicianAssignment.status, 'DISPATCHED');
      assert.strictEqual(updated.technicianAssignment.trade, 'PLUMBER');
      assert.strictEqual(updated.version, 2);

      // Critical Check: Administrative authority assignment MUST remain untouched!
      assert.strictEqual(updated.status, 'ASSIGNED');
      assert.strictEqual(updated.assignedToUserUuid, campusHead.userUuid);
      assert.strictEqual(updated.assignedToRole, 'CAMPUS_SERVICES_HEAD');

      opDoc = updated;

      // Verify ledger records technician assignment event
      const ledger = await ComplaintEventLedger.find({ complaintUuid: opComplaintUuid, eventType: 'TECHNICIAN_ASSIGNED' });
      assert.strictEqual(ledger.length, 1);
      assert.strictEqual(ledger[0].actorUuid, campusHead.userUuid);
    });

    it('3. Unauthorized technician cannot update assignment or submit repair work (403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.updateTechnicianWork(
            technicianOther, // Not assigned to this complaint
            opComplaintUuid,
            {
              status: 'IN_PROGRESS',
              resolutionNotes: 'Unauthorized technician attempt'
            },
            opDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('4. Assigned technician updates physical work to IN_PROGRESS', async () => {
      const inProgress = await complaintAggregate.updateTechnicianWork(
        technicianVijay,
        opComplaintUuid,
        {
          status: 'IN_PROGRESS',
          resolutionNotes: 'Shut off main valve; excavating pipe joint'
        },
        opDoc.version
      );

      assert.strictEqual(inProgress.technicianAssignment.status, 'IN_PROGRESS');
      assert.ok(inProgress.technicianAssignment.startedAt);
      assert.strictEqual(inProgress.version, 3);

      // Administrative authority state remains intact
      assert.strictEqual(inProgress.status, 'ASSIGNED');
      assert.strictEqual(inProgress.assignedToUserUuid, campusHead.userUuid);

      opDoc = inProgress;
    });

    it('5. Assigned technician marks physical repair RESOLVED with evidence photo URL', async () => {
      const resolvedTech = await complaintAggregate.updateTechnicianWork(
        technicianVijay,
        opComplaintUuid,
        {
          status: 'RESOLVED',
          resolutionNotes: 'Replaced ruptured 2-inch PVC junction with reinforced brass coupling.',
          evidenceUrls: ['/storage/local/evidence/pipe_repair_completed.png']
        },
        opDoc.version
      );

      assert.strictEqual(resolvedTech.technicianAssignment.status, 'RESOLVED');
      assert.ok(resolvedTech.technicianAssignment.resolvedAt);
      assert.strictEqual(resolvedTech.technicianAssignment.evidenceUrls.length, 1);
      assert.strictEqual(resolvedTech.version, 4);

      // CRITICAL ACCEPTANCE PROPERTY:
      // Physical technician repair completion does NOT automatically close or resolve institutional complaint!
      assert.strictEqual(resolvedTech.status, 'ASSIGNED');
      assert.strictEqual(resolvedTech.assignedToUserUuid, campusHead.userUuid);

      opDoc = resolvedTech;
    });

    it('6. Operational authority inspects physical repair evidence and verifies administrative RESOLVED state', async () => {
      const adminResolved = await complaintAggregate.executeAction(
        campusHead,
        opComplaintUuid,
        'RESOLVE',
        'Physical repair inspected on-site. Pressure tests verified normal. Complaint resolved.',
        opDoc.version
      );

      assert.strictEqual(adminResolved.status, 'RESOLVED');
      assert.strictEqual(adminResolved.resolvedByUserUuid, campusHead.userUuid);
      assert.strictEqual(adminResolved.version, 5);

      opDoc = adminResolved;

      // Verify CQRS snapshot reflects both technician status and complaint status
      const snapshot = await ComplaintSnapshot.findOne({ complaintUuid: opComplaintUuid });
      assert.strictEqual(snapshot.status, 'RESOLVED');
      assert.strictEqual(snapshot.technicianStatus, 'RESOLVED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 4 — EXCEPTIONS, POLICY ENFORCEMENT & SECURITY REGRESSION
  // ═════════════════════════════════════════════════════════════════════
  describe('Phase 4 — Workflow Exceptions & Policy Enforcement', () => {
    let exceptionComplaintUuid;

    it('1. Return for correction requires mandatory correction instructions and allows student resubmission', async () => {
      const uuid = crypto.randomUUID();
      exceptionComplaintUuid = uuid;

      const comp = new Complaint({
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
        complaintUuid: uuid,
        complaintCode: 'CMP-2026-IT-003001',
        title: 'Fee Payment Receipt Discrepancy',
        description: 'Semester 4 fees paid but portal shows pending.',
        categoryCode: 'ACADEMIC',
        subcategoryCode: 'FEES',
        departmentCode: 'IT',
        divisionCode: '2024-IT-A',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        version: 1,
        createdById: student._id,
        createdByUserUuid: student.userUuid,
        createdByName: student.fullName,
        createdByEmail: student.email,
        assignedToUserUuid: ci.userUuid,
        assignedToName: ci.fullName,
        assignedToRole: 'CLASS_INCHARGE',
        slaTimers: {
          resolutionSlaDeadline: new Date(Date.now() + 86400000),
          slaWarningThreshold: new Date(Date.now() + 60000000),
          slaBreached: false
        }
      });
      await comp.save();

      // Return without note fails validation
      await assert.rejects(
        async () => {
          await complaintAggregate.executeTransitionWithConcurrency(
            ci,
            uuid,
            'RETURNED_FOR_CORRECTION',
            '', // Empty note
            1
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'VAL_CORRECTION_INSTRUCTIONS');
          return true;
        }
      );

      // Return with valid instructions
      const returned = await complaintAggregate.executeTransitionWithConcurrency(
        ci,
        uuid,
        'RETURNED_FOR_CORRECTION',
        'Please upload your bank transaction UTR reference and payment screenshot.',
        1
      );
      assert.strictEqual(returned.status, 'RETURNED_FOR_CORRECTION');
      assert.strictEqual(returned.correctionDetails.instructions, 'Please upload your bank transaction UTR reference and payment screenshot.');

      // Resubmit by student
      const resubmitted = await complaintAggregate.executeTransitionWithConcurrency(
        student,
        uuid,
        'SUBMITTED',
        'Attached UTR reference 20260408129381. Kindly verify.',
        2
      );
      assert.strictEqual(resubmitted.status, 'ASSIGNED'); // Restored to active handler
      assert.strictEqual(resubmitted.version, 3);
    });

    it('2. Complaint rejection requires mandatory justification reason', async () => {
      const currentDoc = await Complaint.findOne({ complaintUuid: exceptionComplaintUuid });

      // Reject without note fails
      await assert.rejects(
        async () => {
          await complaintAggregate.executeTransitionWithConcurrency(
            ci,
            exceptionComplaintUuid,
            'REJECTED',
            '   ', // Whitespace only
            currentDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'VAL_REJECTION_REASON');
          return true;
        }
      );

      // Reject with valid justification
      const rejected = await complaintAggregate.executeTransitionWithConcurrency(
        ci,
        exceptionComplaintUuid,
        'REJECTED',
        'UTR belongs to another student account number.',
        currentDoc.version
      );
      assert.strictEqual(rejected.status, 'REJECTED');
      assert.strictEqual(rejected.rejectionDetails.reason, 'UTR belongs to another student account number.');
    });

    it('3. Student reconsideration appeal on RESOLVED complaint routes up the hierarchy chain', async () => {
      // Create a resolved complaint by CI
      const appealUuid = crypto.randomUUID();
      const appealComp = new Complaint({
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
        complaintUuid: appealUuid,
        complaintCode: 'CMP-2026-IT-004001',
        title: 'Library Book Lost Fine Issue',
        description: 'Fine levied erroneously.',
        categoryCode: 'ACADEMIC',
        subcategoryCode: 'LIBRARY',
        departmentCode: 'IT',
        divisionCode: '2024-IT-A',
        priority: 'LOW',
        status: 'RESOLVED',
        version: 1,
        createdById: student._id,
        createdByUserUuid: student.userUuid,
        createdByName: student.fullName,
        createdByEmail: student.email,
        assignedToUserUuid: ci.userUuid,
        assignedToName: ci.fullName,
        assignedToRole: 'CLASS_INCHARGE',
        resolvedByUserUuid: ci.userUuid,
        resolvedByName: ci.fullName,
        resolvedAt: new Date(),
        slaTimers: {
          resolutionSlaDeadline: new Date(Date.now() + 86400000),
          slaWarningThreshold: new Date(Date.now() + 60000000),
          slaBreached: false
        }
      });
      await appealComp.save();

      // Student requests reconsideration -> Escalates to Teacher Guardian
      const appealed = await complaintAggregate.executeTransitionWithConcurrency(
        student,
        appealUuid,
        'ESCALATED',
        'Book was already returned on 12th Oct. Receipt attached.',
        1
      );

      assert.strictEqual(appealed.status, 'ESCALATED');
      assert.strictEqual(appealed.assignedToUserUuid, tg.userUuid);
      assert.strictEqual(appealed.assignedToRole, 'TEACHER_GUARDIAN');
    });

    it('4. Principal policy approval enforcement across PENDING, REJECTED, and APPROVED states', async () => {
      const policyUuid = crypto.randomUUID();
      const policyComp = new Complaint({
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
        complaintUuid: policyUuid,
        complaintCode: 'CMP-2026-IT-005001',
        title: 'Department AI Cluster GPU Expansion',
        description: 'Requires ₹4,00,000 capital approval.',
        categoryCode: 'ACADEMIC',
        subcategoryCode: 'EQUIPMENT',
        departmentCode: 'IT',
        divisionCode: '2024-IT-A',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        version: 1,
        createdById: student._id,
        createdByUserUuid: student.userUuid,
        createdByName: student.fullName,
        createdByEmail: student.email,
        assignedToUserUuid: hod.userUuid,
        assignedToName: hod.fullName,
        assignedToRole: 'HOD',
        slaTimers: {
          resolutionSlaDeadline: new Date(Date.now() + 86400000),
          slaWarningThreshold: new Date(Date.now() + 60000000),
          slaBreached: false
        },
        policyApproval: {
          requiresPrincipalApproval: true,
          policyReason: 'Capital expense exceeding threshold',
          approvalStatus: 'PENDING_APPROVAL'
        }
      });
      await policyComp.save();

      // 1. Resolution blocked while PENDING_APPROVAL
      await assert.rejects(
        async () => {
          await complaintAggregate.executeTransitionWithConcurrency(
            hod,
            policyUuid,
            'RESOLVED',
            'HOD attempting premature resolution',
            1
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'PRINCIPAL_APPROVAL_REQUIRED');
          return true;
        }
      );

      // 2. Principal REJECTS policy approval
      const rejectedPolicy = await complaintAggregate.decidePrincipalApproval(
        principal,
        policyUuid,
        {
          decision: 'REJECTED',
          decisionNotes: 'Budget freeze for current fiscal quarter.'
        },
        1
      );
      assert.strictEqual(rejectedPolicy.policyApproval.approvalStatus, 'REJECTED');
      assert.strictEqual(rejectedPolicy.version, 2);

      // Resolution blocked when REJECTED
      await assert.rejects(
        async () => {
          await complaintAggregate.executeTransitionWithConcurrency(
            hod,
            policyUuid,
            'RESOLVED',
            'HOD attempting resolution on rejected policy',
            2
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'POLICY_APPROVAL_REJECTED');
          return true;
        }
      );

      // 3. Principal APPROVES revised policy
      const approvedPolicy = await complaintAggregate.decidePrincipalApproval(
        principal,
        policyUuid,
        {
          decision: 'APPROVED',
          decisionNotes: 'Approved under special research endowment grant.'
        },
        2
      );
      assert.strictEqual(approvedPolicy.policyApproval.approvalStatus, 'APPROVED');
      assert.strictEqual(approvedPolicy.version, 3);

      // Resolution now succeeds
      const finalResolved = await complaintAggregate.executeTransitionWithConcurrency(
        hod,
        policyUuid,
        'RESOLVED',
        'GPU cluster procured and commissioned under research grant.',
        3
      );
      assert.strictEqual(finalResolved.status, 'RESOLVED');
      assert.strictEqual(finalResolved.version, 4);
    });
  });
});

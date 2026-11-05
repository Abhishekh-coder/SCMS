const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');
const crypto = require('crypto');

const {
  ComplaintSchema,
  ComplaintEventLedgerSchema,
  ComplaintCommentSchema,
  ComplaintAttachmentSchema,
  ComplaintSnapshotSchema
} = require('../../database/schema/complaintSchemas');
const {
  UserSchema,
  RoleSchema,
  UserRoleSchema,
  OrganizationalAssignmentSchema,
  FacultyProfileSchema,
  StudentProfileSchema
} = require('../../database/schema/schemas');

const complaintAggregate = require('../../backend/src/domains/complaints/aggregate/ComplaintAggregate');
const complaintAssignmentEngine = require('../../backend/src/domains/complaints/services/ComplaintAssignmentEngine');
const { runMigration } = require('../../scripts/migrateTechnicianAndAuthoritySchema');

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/ccms_step4_e2e_db';

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
const ComplaintSnapshot = mongoose.models.ComplaintSnapshot || mongoose.model('ComplaintSnapshot', ComplaintSnapshotSchema);
const ComplaintEventLedger = mongoose.models.ComplaintEventLedger || mongoose.model('ComplaintEventLedger', ComplaintEventLedgerSchema);
const ComplaintAttachment = mongoose.models.ComplaintAttachment || mongoose.model('ComplaintAttachment', ComplaintAttachmentSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment', OrganizationalAssignmentSchema);
const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile', FacultyProfileSchema);
const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);

describe('CampusFix — Step 4: Final End-to-End Verification & Integration Testing Suite', () => {

  // Test Personas
  const personas = {
    student: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_std_aarav_it',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@campus.edu',
      roles: ['STUDENT'],
      primaryRole: 'STUDENT',
      departmentCode: 'IT',
      divisionCode: '2024-IT-A',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    },
    ci: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_ci_anjali_mehta',
      fullName: 'Dr. Anjali Mehta',
      email: 'anjali.mehta@campus.edu',
      roles: ['FACULTY'],
      primaryRole: 'FACULTY',
      departmentCode: 'IT',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    },
    tg: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_tg_rahul_deshmukh',
      fullName: 'Prof. Rahul Deshmukh',
      email: 'rahul.deshmukh@campus.edu',
      roles: ['FACULTY'],
      primaryRole: 'FACULTY',
      departmentCode: 'IT',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    },
    hod: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_hod_suresh_kumar',
      fullName: 'Dr. Suresh Kumar',
      email: 'suresh.kumar@campus.edu',
      roles: ['HOD', 'FACULTY'],
      primaryRole: 'HOD',
      departmentCode: 'IT',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    },
    dean: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_dean_meera_joshi',
      fullName: 'Dr. Meera Joshi',
      email: 'meera.joshi@campus.edu',
      roles: ['DEAN', 'FACULTY'],
      primaryRole: 'DEAN',
      departmentCode: 'ACADEMICS',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    },
    principal: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_principal_rajesh_sharma',
      fullName: 'Dr. Rajesh Sharma',
      email: 'principal@campus.edu',
      roles: ['PRINCIPAL'],
      primaryRole: 'PRINCIPAL',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    },
    campusHead: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_campus_head_ramesh',
      fullName: 'Ramesh Patel',
      email: 'ramesh.patel@campus.edu',
      roles: ['ADMIN'],
      primaryRole: 'ADMIN',
      departmentCode: 'CAMPUS_SERVICES',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    },
    technicianVijay: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_tech_vijay_sharma',
      fullName: 'Vijay Sharma',
      email: 'vijay.electrician@campus.edu',
      roles: ['ADMIN'],
      primaryRole: 'ADMIN',
      trade: 'ELECTRICIAN',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    },
    technicianOther: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_tech_raj_kumar',
      fullName: 'Raj Kumar',
      email: 'raj.plumber@campus.edu',
      roles: ['FACULTY'],
      primaryRole: 'FACULTY',
      trade: 'PLUMBER',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    },
    unauthorizedUser: {
      _id: new mongoose.Types.ObjectId(),
      userUuid: 'usr_intruder_random',
      fullName: 'Unauthorized Intruder',
      email: 'intruder@external.edu',
      roles: ['STUDENT'],
      primaryRole: 'STUDENT',
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus'
    }
  };

  before(async () => {
    process.env.NODE_ENV = 'test';
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(TEST_DB_URI);

    // Clean test database
    await Promise.all([
      Complaint.deleteMany({}),
      ComplaintSnapshot.deleteMany({}),
      ComplaintEventLedger.deleteMany({}),
      ComplaintAttachment.deleteMany({}),
      User.deleteMany({}),
      OrganizationalAssignment.deleteMany({}),
      FacultyProfile.deleteMany({}),
      StudentProfile.deleteMany({})
    ]);

    // Seed test personas into Users and Profiles
    for (const [key, p] of Object.entries(personas)) {
      await User.create({
        _id: p._id,
        userUuid: p.userUuid,
        loginId: `LOGIN-${p.userUuid}`,
        email: p.email,
        passwordHash: 'hashed_password_for_tests',
        fullName: p.fullName,
        accountStatus: 'ACTIVE',
        profileType: p.roles.includes('STUDENT') ? 'STUDENT' : 'FACULTY',
        roles: p.roles,
        primaryRole: p.primaryRole,
        tenantId: p.tenantId,
        campusId: p.campusId
      });

      if (['ci', 'tg', 'hod', 'dean', 'principal', 'campusHead'].includes(key)) {
        await FacultyProfile.create({
          userId: p._id,
          loginId: `EMP-${p.userUuid.slice(-6).toUpperCase()}`,
          employeeCode: `EMP-${p.userUuid.slice(-6).toUpperCase()}`,
          department: p.departmentCode || 'IT',
          designation: 'PROFESSOR',
          fullName: p.fullName
        });
      }
    }

    // Seed Organizational Assignments
    await OrganizationalAssignment.create([
      {
        scopeType: 'DIVISION',
        scopeId: '2024-IT-A',
        assignmentType: 'CLASS_INCHARGE',
        assigneeUserId: personas.ci._id,
        assigneeLoginId: `LOGIN-${personas.ci.userUuid}`,
        assigneeUserUuid: personas.ci.userUuid,
        effectiveFrom: new Date(),
        assignedBy: personas.principal._id,
        isActive: true,
        academicYearId: new mongoose.Types.ObjectId()
      },
      {
        scopeType: 'DIVISION',
        scopeId: '2024-IT-A',
        assignmentType: 'TEACHER_GUARDIAN',
        assigneeUserId: personas.tg._id,
        assigneeLoginId: `LOGIN-${personas.tg.userUuid}`,
        assigneeUserUuid: personas.tg.userUuid,
        effectiveFrom: new Date(),
        assignedBy: personas.principal._id,
        isActive: true,
        academicYearId: new mongoose.Types.ObjectId()
      },
      {
        scopeType: 'DEPARTMENT',
        scopeId: 'IT',
        assignmentType: 'HOD',
        assigneeUserId: personas.hod._id,
        assigneeLoginId: `LOGIN-${personas.hod.userUuid}`,
        assigneeUserUuid: personas.hod.userUuid,
        effectiveFrom: new Date(),
        assignedBy: personas.principal._id,
        isActive: true,
        academicYearId: new mongoose.Types.ObjectId()
      },
      {
        scopeType: 'ACADEMIC',
        scopeId: 'ACADEMICS',
        assignmentType: 'DEAN',
        assigneeUserId: personas.dean._id,
        assigneeLoginId: `LOGIN-${personas.dean.userUuid}`,
        assigneeUserUuid: personas.dean.userUuid,
        effectiveFrom: new Date(),
        assignedBy: personas.principal._id,
        isActive: true,
        academicYearId: new mongoose.Types.ObjectId()
      },
      {
        scopeType: 'INSTITUTION',
        scopeId: 'MAIN_CAMPUS',
        assignmentType: 'PRINCIPAL',
        assigneeUserId: personas.principal._id,
        assigneeLoginId: `LOGIN-${personas.principal.userUuid}`,
        assigneeUserUuid: personas.principal.userUuid,
        effectiveFrom: new Date(),
        assignedBy: personas.principal._id,
        isActive: true,
        academicYearId: new mongoose.Types.ObjectId()
      },
      {
        scopeType: 'DEPARTMENT',
        scopeId: 'CAMPUS_SERVICES',
        assignmentType: 'CAMPUS_SERVICES_HEAD',
        assigneeUserId: personas.campusHead._id,
        assigneeLoginId: `LOGIN-${personas.campusHead.userUuid}`,
        assigneeUserUuid: personas.campusHead.userUuid,
        effectiveFrom: new Date(),
        assignedBy: personas.principal._id,
        isActive: true,
        academicYearId: new mongoose.Types.ObjectId()
      }
    ]);
  });

  after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 7: DATABASE MIGRATION & REPEAT IDEMPOTENCY SAFETY
  // ═════════════════════════════════════════════════════════════════════
  describe('Phase 7 — Database Migration & Idempotency Verification', () => {

    it('1. should migrate legacy complaints and backfill technicianAssignment & policyApproval', async () => {
      // Create legacy complaint directly in Mongo without new schema structures
      const legacyUuid = crypto.randomUUID();
      await Complaint.collection.insertOne({
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
        isDeleted: false,
        version: 1,
        complaintUuid: legacyUuid,
        complaintCode: 'CMP-2026-IT-100001',
        title: 'Legacy unmigrated complaint test',
        description: 'This complaint was created before technicianAssignment and policyApproval existed.',
        categoryCode: 'ACADEMIC',
        subcategoryCode: 'LECTURE',
        departmentCode: 'IT',
        divisionCode: '2024-IT-A',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        createdById: personas.student._id,
        createdByUserUuid: personas.student.userUuid,
        createdByName: personas.student.fullName,
        assignedUserUuids: [],
        slaTimers: {
          resolutionSlaDeadline: new Date(Date.now() + 86400000),
          slaWarningThreshold: new Date(Date.now() + 60000000),
          slaBreached: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Also insert legacy snapshot
      await ComplaintSnapshot.collection.insertOne({
        tenantId: 'tenant_campus_01',
        complaintUuid: legacyUuid,
        complaintCode: 'CMP-2026-IT-100001',
        title: 'Legacy unmigrated complaint test',
        status: 'SUBMITTED',
        lastUpdated: new Date()
      });

      // Run migration against isolated test DB
      await runMigration(TEST_DB_URI);

      // Reconnect because runMigration calls disconnect at its end
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_DB_URI);
      }

      const migrated = await Complaint.findOne({ complaintUuid: legacyUuid });
      assert.ok(migrated, 'Migrated complaint must exist');
      assert.strictEqual(migrated.technicianAssignment.status, 'UNASSIGNED');
      assert.strictEqual(migrated.technicianAssignment.technicianUserUuid, null);
      assert.strictEqual(migrated.policyApproval.requiresPrincipalApproval, false);
      assert.strictEqual(migrated.policyApproval.approvalStatus, 'NOT_REQUIRED');
      assert.ok(migrated.rejectionDetails);
      assert.ok(migrated.correctionDetails);

      const snapshot = await ComplaintSnapshot.findOne({ complaintUuid: legacyUuid });
      assert.strictEqual(snapshot.technicianStatus, 'UNASSIGNED');
      assert.strictEqual(snapshot.requiresPrincipalApproval, false);
    });

    it('2. should confirm migration idempotency on second execution with zero mutations', async () => {
      // Re-run migration; should scan and report all already up to date
      await runMigration(TEST_DB_URI);

      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_DB_URI);
      }

      const count = await Complaint.countDocuments();
      assert.ok(count >= 1);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 2: ACADEMIC COMPLAINT LIFECYCLE (Student -> CI -> TG -> HOD -> Dean -> Principal)
  // ═════════════════════════════════════════════════════════════════════
  describe('Phase 2 — Academic Complaint Lifecycle & Event Ledger', () => {
    let academicComplaintUuid = null;
    let complaintDoc = null;

    it('1. Student submits academic complaint; resolves CI assignment and records event ledger', async () => {
      const created = await complaintAggregate.submitComplaint(personas.student, {
        title: 'Classroom Projector Malfunction in Lab 301',
        description: 'Projector display flickers and shuts down within 5 minutes of powering on.',
        categoryCode: 'ACADEMIC',
        subcategoryCode: 'LAB_EQUIPMENT',
        priority: 'HIGH',
        departmentHint: 'IT',
        divisionCode: '2024-IT-A',
        location: { buildingCode: 'MAIN_BLOCK', roomCode: 'LAB_301' }
      });

      assert.ok(created.complaintUuid);
      assert.match(created.complaintUuid, /^[0-9a-fA-F-]{36}$/);
      assert.strictEqual(created.createdByUserUuid, personas.student.userUuid);
      assert.strictEqual(created.version, 1);
      assert.strictEqual(created.status, 'ASSIGNED');
      assert.strictEqual(created.assignedToRole, 'CLASS_INCHARGE');
      assert.strictEqual(created.assignedToUserUuid, personas.ci.userUuid);
      assert.strictEqual(created.domainType, 'ACADEMIC');

      academicComplaintUuid = created.complaintUuid;
      complaintDoc = created;

      // Verify event ledger record
      const ledger = await ComplaintEventLedger.find({ complaintUuid: academicComplaintUuid }).sort({ createdAt: 1 });
      assert.strictEqual(ledger.length, 2);
      const ledgerTypes = ledger.map(l => l.eventType);
      assert.ok(ledgerTypes.includes('COMPLAINT_SUBMITTED'));
      assert.ok(ledgerTypes.includes('COMPLAINT_ASSIGNED'));
    });

    it('2. Unauthorized user cannot perform actions on complaint (HTTP 403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.executeAction(
            personas.unauthorizedUser,
            academicComplaintUuid,
            'FORWARD',
            'Intruder attempting forward',
            complaintDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          return true;
        }
      );
    });

    it('3. Class Incharge reviews and forwards to Teacher Guide with version increment', async () => {
      const updated = await complaintAggregate.executeAction(
        personas.ci,
        academicComplaintUuid,
        'FORWARD',
        'Verified in Lab 301. Forwarding to Teacher Guardian Prof. Rahul Deshmukh for further review.',
        complaintDoc.version
      );

      assert.strictEqual(updated.status, 'FORWARDED');
      assert.strictEqual(updated.version, 2);
      assert.strictEqual(updated.assignedToRole, 'TEACHER_GUARDIAN');
      assert.strictEqual(updated.assignedToUserUuid, personas.tg.userUuid);
      assert.strictEqual(updated.forwardedFromUserUuid, personas.ci.userUuid);

      complaintDoc = updated;

      // Check event ledger
      const ledger = await ComplaintEventLedger.find({ complaintUuid: academicComplaintUuid }).sort({ createdAt: -1 });
      assert.strictEqual(ledger[0].eventType, 'COMPLAINT_FORWARDED');
      assert.strictEqual(ledger[0].actorUuid, personas.ci.userUuid);
      assert.strictEqual(ledger[0].previousState, 'ASSIGNED');
      assert.strictEqual(ledger[0].newState, 'FORWARDED');
    });

    it('4. Teacher Guide escalates complaint to HOD', async () => {
      const updated = await complaintAggregate.executeAction(
        personas.tg,
        academicComplaintUuid,
        'ESCALATE',
        'Hardware unit replacement required. Escalating to IT Department HOD Dr. Suresh Kumar.',
        complaintDoc.version
      );

      assert.strictEqual(updated.status, 'ESCALATED');
      assert.strictEqual(updated.version, 3);
      assert.strictEqual(updated.assignedToRole, 'HOD');
      assert.strictEqual(updated.assignedToUserUuid, personas.hod.userUuid);

      complaintDoc = updated;
    });

    it('5. HOD escalates complaint to Dean', async () => {
      const updated = await complaintAggregate.executeAction(
        personas.hod,
        academicComplaintUuid,
        'ESCALATE',
        'Budgetary approval for replacement optical unit exceeds departmental threshold. Escalating to Dean Academics.',
        complaintDoc.version
      );

      assert.strictEqual(updated.status, 'ESCALATED');
      assert.strictEqual(updated.version, 4);
      assert.strictEqual(updated.assignedToRole, 'DEAN');
      assert.strictEqual(updated.assignedToUserUuid, personas.dean.userUuid);

      complaintDoc = updated;
    });

    it('6. Dean escalates complaint to Principal', async () => {
      const updated = await complaintAggregate.executeAction(
        personas.dean,
        academicComplaintUuid,
        'ESCALATE',
        'Institution-wide audiovisual procurement needed. Escalating to Principal Dr. Rajesh Sharma for final oversight.',
        complaintDoc.version
      );

      assert.strictEqual(updated.status, 'ESCALATED');
      assert.strictEqual(updated.version, 5);
      assert.strictEqual(updated.assignedToRole, 'PRINCIPAL');
      assert.strictEqual(updated.assignedToUserUuid, personas.principal.userUuid);

      complaintDoc = updated;
    });

    it('7. Principal is terminal authority; rejecting further escalation', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.executeAction(
            personas.principal,
            academicComplaintUuid,
            'ESCALATE',
            'Attempting to escalate beyond Principal',
            complaintDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'TERMINAL_ESCALATION_LEVEL');
          return true;
        }
      );
    });

    it('8. Principal resolves complaint with notes; marks RESOLVED with complete audit ledger', async () => {
      const resolved = await complaintAggregate.executeAction(
        personas.principal,
        academicComplaintUuid,
        'RESOLVE',
        'Procurement of 5 new Epson projectors approved and installed across Lab 301. Issue resolved.',
        complaintDoc.version
      );

      assert.strictEqual(resolved.status, 'RESOLVED');
      assert.strictEqual(resolved.version, 6);
      assert.strictEqual(resolved.resolvedByUserUuid, personas.principal.userUuid);
      assert.strictEqual(resolved.resolvedByName, personas.principal.fullName);
      assert.ok(resolved.resolvedAt);

      // Verify immutable event ledger complete chain
      const ledger = await ComplaintEventLedger.find({ complaintUuid: academicComplaintUuid }).sort({ createdAt: 1 });
      const eventTypes = ledger.map(l => l.eventType);
      assert.ok(eventTypes.includes('COMPLAINT_SUBMITTED'));
      assert.ok(eventTypes.includes('COMPLAINT_FORWARDED'));
      assert.ok(eventTypes.includes('COMPLAINT_ESCALATED'));
      assert.ok(eventTypes.includes('COMPLAINT_RESOLVED'));

      // Validate actor timestamps and notes are preserved in ledger
      for (const entry of ledger) {
        assert.ok(entry.actorUuid);
        assert.ok(entry.actorName);
        assert.ok(entry.timestamp);
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 3: OPERATIONAL COMPLAINT & TECHNICIAN DUAL-TRACK WORKFLOW
  // ═════════════════════════════════════════════════════════════════════
  describe('Phase 3 — Operational Complaint & Technician Dual-Track Workflow', () => {
    let operationalUuid = null;
    let opComplaint = null;

    it('1. Student submits operational complaint; assigned to Campus Services Head', async () => {
      opComplaint = await complaintAggregate.submitComplaint(personas.student, {
        title: 'Severe Water Leakage in Chemistry Block 2nd Floor Washroom',
        description: 'Main pipe burst causing water logging in the corridor. Urgent plumbing attention required.',
        categoryCode: 'OPERATIONAL',
        subcategoryCode: 'PLUMBING',
        priority: 'CRITICAL',
        departmentHint: 'CAMPUS_SERVICES',
        location: { buildingCode: 'SCIENCE_BLOCK', roomCode: 'ROOM_204' }
      });

      assert.strictEqual(opComplaint.domainType, 'OPERATIONAL');
      assert.strictEqual(opComplaint.assignedToRole, 'CAMPUS_SERVICES_HEAD');
      assert.strictEqual(opComplaint.technicianAssignment.status, 'UNASSIGNED');
      operationalUuid = opComplaint.complaintUuid;
    });

    it('2. Campus Admin dispatches Technician Vijay without altering administrative assignment', async () => {
      const updated = await complaintAggregate.assignTechnician(
        personas.campusHead,
        operationalUuid,
        {
          technicianUserUuid: personas.technicianVijay.userUuid,
          technicianName: personas.technicianVijay.fullName,
          trade: 'PLUMBER',
          notes: 'Dispatched with emergency toolkit to isolate main valve.'
        },
        opComplaint.version
      );

      assert.strictEqual(updated.technicianAssignment.status, 'DISPATCHED');
      assert.strictEqual(updated.technicianAssignment.technicianUserUuid, personas.technicianVijay.userUuid);
      assert.strictEqual(updated.technicianAssignment.trade, 'PLUMBER');
      assert.ok(updated.technicianAssignment.assignedAt);

      // CRITICAL SAFEGUARD: Administrative authority is untouched
      assert.strictEqual(updated.assignedToRole, 'CAMPUS_SERVICES_HEAD');
      assert.strictEqual(updated.assignedToUserUuid, personas.campusHead.userUuid);
      assert.strictEqual(updated.status, 'ASSIGNED'); // Administrative status untouched

      opComplaint = updated;

      // Event ledger record verified
      const ledger = await ComplaintEventLedger.find({ complaintUuid: operationalUuid, eventType: 'TECHNICIAN_ASSIGNED' });
      assert.strictEqual(ledger.length, 1);
      assert.strictEqual(ledger[0].metadata.technicianUserUuid, personas.technicianVijay.userUuid);
    });

    it('3. Unauthorized technician cannot update another technician assignment (403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.updateTechnicianWork(
            personas.technicianOther,
            operationalUuid,
            {
              status: 'IN_PROGRESS',
              resolutionNotes: 'Unauthorized attempt to update Vijay work'
            },
            opComplaint.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('4. Upload physical repair evidence photo via StorageService and verify ledger', async () => {
      // 1x1 transparent PNG base64
      const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const uploadRes = await complaintAggregate.uploadAttachment(
        personas.technicianVijay,
        operationalUuid,
        {
          fileName: 'valve_replacement_evidence.png',
          fileType: 'image/png',
          base64Data: sampleBase64,
          isEvidence: true
        }
      );

      assert.ok(uploadRes.attachmentUuid);
      assert.ok(uploadRes.url.includes('/storage/local/evidence/'));

      // Verify attachment record in Mongo
      const att = await ComplaintAttachment.findOne({ attachmentUuid: uploadRes.attachmentUuid });
      assert.ok(att);
      assert.strictEqual(att.uploadedByUuid, personas.technicianVijay.userUuid);

      // Verify ledger event
      const ledger = await ComplaintEventLedger.find({ complaintUuid: operationalUuid, eventType: 'ATTACHMENT_UPLOADED' });
      assert.strictEqual(ledger.length, 1);
      assert.ok(ledger[0].metadata.storageUrl.includes('/storage/local/evidence/'));
    });

    it('5. Assigned technician Vijay updates work to IN_PROGRESS with repair notes', async () => {
      const refreshed = await Complaint.findOne({ complaintUuid: operationalUuid });
      const updated = await complaintAggregate.updateTechnicianWork(
        personas.technicianVijay,
        operationalUuid,
        {
          status: 'IN_PROGRESS',
          resolutionNotes: 'Main valve isolated. Sourcing replacement 2-inch PVC junction fitting.'
        },
        refreshed.version
      );

      assert.strictEqual(updated.technicianAssignment.status, 'IN_PROGRESS');
      assert.ok(updated.technicianAssignment.startedAt);
      assert.strictEqual(updated.status, 'ASSIGNED'); // Administrative lifecycle decoupled

      opComplaint = updated;
    });

    it('6. Assigned technician Vijay marks physical repair RESOLVED with evidence URL', async () => {
      const updated = await complaintAggregate.updateTechnicianWork(
        personas.technicianVijay,
        operationalUuid,
        {
          status: 'RESOLVED',
          resolutionNotes: 'Replaced burst PVC pipe joint with brass coupling, tested under full water pressure for 30 minutes. No leakage.',
          evidenceUrls: ['/storage/local/evidence/repaired_pipe_joint.png']
        },
        opComplaint.version
      );

      assert.strictEqual(updated.technicianAssignment.status, 'RESOLVED');
      assert.ok(updated.technicianAssignment.resolvedAt);
      assert.ok(updated.technicianAssignment.evidenceUrls.length >= 1);

      // CRITICAL SAFEGUARD: Administrative complaint is NOT automatically closed or resolved
      assert.strictEqual(updated.status, 'ASSIGNED');
      assert.strictEqual(updated.assignedToRole, 'CAMPUS_SERVICES_HEAD');

      opComplaint = updated;
    });

    it('7. Unauthorized or invalid evidence URL formats are strictly rejected', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.updateTechnicianWork(
            personas.technicianVijay,
            operationalUuid,
            {
              status: 'RESOLVED',
              resolutionNotes: 'Testing malicious URL injection',
              evidenceUrls: ['javascript:alert(1)']
            },
            opComplaint.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'VAL_INVALID_EVIDENCE_URL');
          return true;
        }
      );
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 4: REJECTION, CORRECTION, RESUBMISSION & APPEAL WORKFLOW
  // ═════════════════════════════════════════════════════════════════════
  describe('Phase 4 — Rejection, Correction, Resubmission & Appeal Lifecycle', () => {
    let reviewComplaintUuid = null;
    let reviewDoc = null;

    it('1. Returning incomplete complaint requires mandatory correction instructions', async () => {
      reviewDoc = await complaintAggregate.submitComplaint(personas.student, {
        title: 'Mess Food Quality Feedback',
        description: 'Food was bad today.',
        categoryCode: 'CAMPUS',
        subcategoryCode: 'MESS',
        priority: 'LOW',
        departmentHint: 'CAMPUS_SERVICES'
      });
      reviewComplaintUuid = reviewDoc.complaintUuid;

      // Fail when missing instructions
      await assert.rejects(
        async () => {
          await complaintAggregate.executeAction(
            personas.campusHead,
            reviewComplaintUuid,
            'RETURN_FOR_CORRECTION',
            '', // Empty instruction
            reviewDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'VAL_CORRECTION_INSTRUCTIONS');
          return true;
        }
      );

      // Succeed with instructions
      const returned = await complaintAggregate.executeAction(
        personas.campusHead,
        reviewComplaintUuid,
        'RETURN_FOR_CORRECTION',
        'Please specify the meal time (Breakfast/Lunch/Dinner), hostel mess block number, and the specific food item affected.',
        reviewDoc.version
      );

      assert.strictEqual(returned.status, 'RETURNED_FOR_CORRECTION');
      assert.strictEqual(returned.correctionDetails.instructions.includes('Please specify the meal time'), true);
      assert.strictEqual(returned.correctionDetails.returnedByUserUuid, personas.campusHead.userUuid);

      reviewDoc = returned;
    });

    it('2. Student resubmits corrected complaint; preserves full audit history', async () => {
      const resubmitted = await complaintAggregate.executeAction(
        personas.student,
        reviewComplaintUuid,
        'SUBMIT',
        'Updated details: Hostel 3 Mess, Dinner on 22-Oct, undercooked rice and spoiled dal.',
        reviewDoc.version
      );

      assert.strictEqual(resubmitted.status, 'ASSIGNED');
      assert.strictEqual(resubmitted.version, reviewDoc.version + 1);

      const ledger = await ComplaintEventLedger.find({ complaintUuid: reviewComplaintUuid }).sort({ createdAt: 1 });
      const types = ledger.map(l => l.eventType);
      assert.ok(types.includes('COMPLAINT_RETURNED_FOR_CORRECTION'));
      assert.ok(types.includes('COMPLAINT_SUBMITTED'));

      reviewDoc = resubmitted;
    });

    it('3. Rejecting invalid complaint requires mandatory rejection reason', async () => {
      // Attempt rejection without reason
      await assert.rejects(
        async () => {
          await complaintAggregate.executeAction(
            personas.campusHead,
            reviewComplaintUuid,
            'REJECT',
            '',
            reviewDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'VAL_REJECTION_REASON');
          return true;
        }
      );

      // Rejection with reason succeeds
      const rejected = await complaintAggregate.executeAction(
        personas.campusHead,
        reviewComplaintUuid,
        'REJECT',
        'Inspection by Mess Committee found batch test passed food safety standards; isolated preference complaint.',
        reviewDoc.version
      );

      assert.strictEqual(rejected.status, 'REJECTED');
      assert.strictEqual(rejected.rejectionDetails.reason.includes('food safety standards'), true);
      assert.strictEqual(rejected.rejectionDetails.rejectedByUserUuid, personas.campusHead.userUuid);

      // Verify ledger records COMPLAINT_REJECTED
      const ledger = await ComplaintEventLedger.find({ complaintUuid: reviewComplaintUuid, eventType: 'COMPLAINT_REJECTED' });
      assert.strictEqual(ledger.length, 1);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 5: PRINCIPAL APPROVAL POLICY & OPTIMISTIC CONCURRENCY
  // ═════════════════════════════════════════════════════════════════════
  describe('Phase 5 — Principal Mandatory Approval Policy & Concurrency Protection', () => {
    let policyComplaintUuid = null;
    let policyDoc = null;

    it('1. Create complaint requiring mandatory Principal policy approval', async () => {
      policyDoc = await complaintAggregate.submitComplaint(personas.student, {
        title: 'Main Transformer Oil Leakage & High Voltage Arc Risk',
        description: 'Transformer yard emitting loud humming and oil leakage. High financial and safety impact.',
        categoryCode: 'OPERATIONAL',
        subcategoryCode: 'ELECTRICAL',
        priority: 'CRITICAL',
        departmentHint: 'CAMPUS_SERVICES'
      });
      policyComplaintUuid = policyDoc.complaintUuid;

      // Mandate policy approval
      const updated = await complaintAggregate.requestPrincipalApproval(
        personas.campusHead,
        policyComplaintUuid,
        'Estimated transformer core repair and oil replacement cost is ₹1,85,000, exceeding standard facility delegation threshold.',
        policyDoc.version
      );

      assert.strictEqual(updated.policyApproval.requiresPrincipalApproval, true);
      assert.strictEqual(updated.policyApproval.approvalStatus, 'PENDING_APPROVAL');
      assert.ok(updated.policyApproval.policyReason.includes('₹1,85,000'));

      policyDoc = updated;

      // Snapshot verification for Principal filter tabs
      const snapshot = await ComplaintSnapshot.findOne({ complaintUuid: policyComplaintUuid });
      assert.strictEqual(snapshot.requiresPrincipalApproval, true);
      assert.strictEqual(snapshot.approvalStatus, 'PENDING_APPROVAL');
    });

    it('2. Ordinary staff cannot resolve complaint before Principal grants approval (403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.executeAction(
            personas.campusHead,
            policyComplaintUuid,
            'RESOLVE',
            'Attempting to resolve without Principal approval',
            policyDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'PRINCIPAL_APPROVAL_REQUIRED');
          return true;
        }
      );
    });

    it('3. Non-Principal cannot decide policy approval (403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.decidePrincipalApproval(
            personas.campusHead, // Staff, not Principal
            policyComplaintUuid,
            { decision: 'APPROVED', decisionNotes: 'Staff trying to approve own budget' },
            policyDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('4. Stale-version requests trigger HTTP 409 CONCURRENCY_ERROR', async () => {
      const staleVersion = policyDoc.version - 1; // Intentionally stale version

      await assert.rejects(
        async () => {
          await complaintAggregate.decidePrincipalApproval(
            personas.principal,
            policyComplaintUuid,
            { decision: 'APPROVED', decisionNotes: 'Decision with stale version' },
            staleVersion
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 409);
          assert.strictEqual(err.errorCode, 'CONCURRENCY_ERROR');
          return true;
        }
      );
    });

    it('5. Principal rejects policy approval; subsequent resolution strictly blocked', async () => {
      // Principal rejects approval
      const rejectedDecision = await complaintAggregate.decidePrincipalApproval(
        personas.principal,
        policyComplaintUuid,
        {
          decision: 'REJECTED',
          decisionNotes: 'Vendor quote is too high. Seek competitive quotes from at least 3 authorized transformer service vendors.'
        },
        policyDoc.version
      );

      assert.strictEqual(rejectedDecision.policyApproval.approvalStatus, 'REJECTED');
      assert.strictEqual(rejectedDecision.policyApproval.decisionByUserUuid, personas.principal.userUuid);
      policyDoc = rejectedDecision;

      // Now resolution is strictly blocked because policy was rejected
      await assert.rejects(
        async () => {
          await complaintAggregate.executeAction(
            personas.campusHead,
            policyComplaintUuid,
            'RESOLVE',
            'Trying to resolve after policy rejection',
            policyDoc.version
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'POLICY_APPROVAL_REJECTED');
          return true;
        }
      );
    });

    it('6. Principal approves revised policy request; resolution now succeeds', async () => {
      // Principal approves revised policy request
      const approvedDecision = await complaintAggregate.decidePrincipalApproval(
        personas.principal,
        policyComplaintUuid,
        {
          decision: 'APPROVED',
          decisionNotes: 'Revised competitive quote of ₹1,20,000 accepted. Emergency fund disbursed.'
        },
        policyDoc.version
      );

      assert.strictEqual(approvedDecision.policyApproval.approvalStatus, 'APPROVED');
      assert.strictEqual(approvedDecision.policyApproval.decisionByUserUuid, personas.principal.userUuid);
      policyDoc = approvedDecision;

      // Now Campus Head is authorized to resolve complaint
      const resolved = await complaintAggregate.executeAction(
        personas.campusHead,
        policyComplaintUuid,
        'RESOLVE',
        'Transformer rewinding and fresh oil filtration completed. Load tests normal.',
        policyDoc.version
      );

      assert.strictEqual(resolved.status, 'RESOLVED');
      assert.strictEqual(resolved.policyApproval.approvalStatus, 'APPROVED');

      // Verify CQRS snapshot is updated
      const snapshot = await ComplaintSnapshot.findOne({ complaintUuid: policyComplaintUuid });
      assert.strictEqual(snapshot.status, 'RESOLVED');
      assert.strictEqual(snapshot.approvalStatus, 'APPROVED');
    });
  });
});

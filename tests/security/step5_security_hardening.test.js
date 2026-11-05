const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const crypto = require('crypto');

const complaintAggregate = require('../../backend/src/domains/complaints/aggregate/ComplaintAggregate');
const complaintController = require('../../backend/src/domains/complaints/controllers/complaint.controller');
const storageService = require('../../backend/src/infrastructure/storage/StorageService');
const registrationController = require('../../backend/src/domains/auth/controllers/registration.controller');

const {
  ComplaintSchema,
  ComplaintSnapshotSchema,
  ComplaintCommentSchema,
  ComplaintAttachmentSchema,
  ComplaintEventLedgerSchema
} = require('../../database/schema/complaintSchemas');

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
const ComplaintSnapshot = mongoose.models.ComplaintSnapshot || mongoose.model('ComplaintSnapshot', ComplaintSnapshotSchema);
const ComplaintComment = mongoose.models.ComplaintComment || mongoose.model('ComplaintComment', ComplaintCommentSchema);
const ComplaintAttachment = mongoose.models.ComplaintAttachment || mongoose.model('ComplaintAttachment', ComplaintAttachmentSchema);
const ComplaintEventLedger = mongoose.models.ComplaintEventLedger || mongoose.model('ComplaintEventLedger', ComplaintEventLedgerSchema);

const testMongoUri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/ccms_step5_security_audit_db';

describe('CampusFix Step 5: Security Hardening & Production Readiness Audit Tests', () => {
  const studentA = {
    userUuid: 'usr_student_alpha_01',
    fullName: 'Alpha Student',
    email: 'alpha@college.edu',
    roles: ['STUDENT'],
    primaryRole: 'STUDENT',
    profileType: 'STUDENT',
    tenantId: 'tenant_campus_01'
  };

  const studentB = {
    userUuid: 'usr_student_bravo_02',
    fullName: 'Bravo Student',
    email: 'bravo@college.edu',
    roles: ['STUDENT'],
    primaryRole: 'STUDENT',
    profileType: 'STUDENT',
    tenantId: 'tenant_campus_01'
  };

  const classInchargeUser = {
    userUuid: 'usr_ci_charlie_03',
    fullName: 'Prof. Charlie (CI)',
    roles: ['FACULTY', 'CLASS_INCHARGE'],
    primaryRole: 'CLASS_INCHARGE',
    profileType: 'FACULTY',
    departmentCode: 'IT',
    divisionCode: '2024-IT-A',
    tenantId: 'tenant_campus_01'
  };

  const principalUser = {
    userUuid: 'usr_principal_delta_04',
    fullName: 'Dr. Delta (Principal)',
    roles: ['PRINCIPAL'],
    primaryRole: 'PRINCIPAL',
    profileType: 'ADMIN',
    tenantId: 'tenant_campus_01'
  };

  let complaintA;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testMongoUri);
    }
    await Complaint.deleteMany({});
    await ComplaintSnapshot.deleteMany({});
    await ComplaintComment.deleteMany({});
    await ComplaintAttachment.deleteMany({});
    await ComplaintEventLedger.deleteMany({});

    // Create a base complaint submitted by Student A
    complaintA = new Complaint({
      complaintUuid: crypto.randomUUID(),
      tenantId: 'tenant_campus_01',
      complaintCode: 'CMP-2026-IT-000101',
      title: 'Lab 402 AC Not Working',
      description: 'The AC unit in Lab 402 is blowing warm air.',
      categoryCode: 'INFRASTRUCTURE',
      subcategoryCode: 'ELECTRICAL',
      departmentCode: 'IT',
      divisionCode: '2024-IT-A',
      location: { building: 'Tech Block', floor: 4, room: '402' },
      priority: 'HIGH',
      status: 'ASSIGNED',
      version: 1,
      createdById: new mongoose.Types.ObjectId(),
      createdByUserUuid: studentA.userUuid,
      createdByName: studentA.fullName,
      createdByEmail: studentA.email,
      assignedToUserUuid: classInchargeUser.userUuid,
      assignedToName: classInchargeUser.fullName,
      assignedToRole: 'CLASS_INCHARGE',
      slaTimers: {
        resolutionSlaDeadline: new Date(Date.now() + 86400000),
        slaWarningThreshold: new Date(Date.now() + 60000000),
        slaBreached: false
      },
      technicianAssignment: {
        technicianUserUuid: null,
        technicianName: null,
        trade: null,
        status: 'UNASSIGNED',
        evidenceUrls: []
      },
      policyApproval: {
        requiresPrincipalApproval: false,
        approvalStatus: 'NOT_REQUIRED'
      }
    });
    await complaintA.save();
  });

  after(async () => {
    await Complaint.deleteMany({});
    await ComplaintSnapshot.deleteMany({});
    await ComplaintComment.deleteMany({});
    await ComplaintAttachment.deleteMany({});
    await ComplaintEventLedger.deleteMany({});
    await mongoose.disconnect();
  });

  // ── 1. IDOR Protection Tests ──
  describe('1. IDOR (Insecure Direct Object Reference) Prevention', () => {
    it('should deny Student B from reading Student A complaint details via getComplaintByUuid (403 Forbidden)', async () => {
      const req = {
        params: { complaintUuid: complaintA.complaintUuid },
        headers: {},
        user: studentB,
        tokenPayload: { roles: ['STUDENT'], userUuid: studentB.userUuid }
      };

      let capturedError = null;
      const res = {
        status: (code) => ({
          json: (body) => body
        })
      };
      const next = (err) => { capturedError = err; };

      await complaintController.getComplaintByUuid(req, res, next);
      assert.ok(capturedError, 'Expected controller to pass an authorization error to next()');
      assert.strictEqual(capturedError.statusCode, 403);
      assert.strictEqual(capturedError.errorCode, 'FORBIDDEN');
    });

    it('should allow Student A to read their own complaint details (200 OK)', async () => {
      const req = {
        params: { complaintUuid: complaintA.complaintUuid },
        headers: {},
        user: studentA,
        tokenPayload: { roles: ['STUDENT'], userUuid: studentA.userUuid }
      };

      let responseStatus = null;
      let responseBody = null;
      const res = {
        status: (code) => {
          responseStatus = code;
          return {
            json: (body) => { responseBody = body; return body; }
          };
        }
      };
      const next = (err) => { throw err; };

      await complaintController.getComplaintByUuid(req, res, next);
      assert.strictEqual(responseStatus, 200);
      assert.strictEqual(responseBody.success, true);
      assert.strictEqual(responseBody.data.complaint.complaintUuid, complaintA.complaintUuid);
    });

    it('should allow authorized Faculty / CI to view the complaint details (200 OK)', async () => {
      const req = {
        params: { complaintUuid: complaintA.complaintUuid },
        headers: {},
        user: classInchargeUser,
        tokenPayload: { roles: classInchargeUser.roles, userUuid: classInchargeUser.userUuid }
      };

      let responseStatus = null;
      const res = {
        status: (code) => {
          responseStatus = code;
          return { json: (b) => b };
        }
      };

      await complaintController.getComplaintByUuid(req, res, () => {});
      assert.strictEqual(responseStatus, 200);
    });

    it('should prevent Student B from commenting on Student A complaint (403 Forbidden)', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.addComment(studentB, complaintA.complaintUuid, 'Unauthorized comment by Student B');
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('should prevent Student B from uploading attachments to Student A complaint (403 Forbidden)', async () => {
      const validPngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]).toString('base64');
      await assert.rejects(
        async () => {
          await complaintAggregate.uploadAttachment(studentB, complaintA.complaintUuid, {
            fileName: 'student_b_evidence.png',
            fileType: 'image/png',
            base64Data: validPngBase64
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'FORBIDDEN');
          return true;
        }
      );
    });
  });

  // ── 2. Evidence Upload & File Content Verification Tests ──
  describe('2. Evidence Upload & File Content Verification', () => {
    it('should reject file upload when actual binary content does not match PNG signature (Magic Byte Check)', async () => {
      // Disguised script inside .png file
      const fakePngBase64 = Buffer.from('<script>alert("XSS")</script>').toString('base64');

      await assert.rejects(
        async () => {
          await complaintAggregate.uploadAttachment(studentA, complaintA.complaintUuid, {
            fileName: 'malicious_script.png',
            fileType: 'image/png',
            base64Data: fakePngBase64
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'VAL_INVALID_FILE_CONTENT');
          assert.ok(err.message.includes('PNG'));
          return true;
        }
      );
    });

    it('should reject file upload when text file is disguised as PDF document', async () => {
      const fakePdfBase64 = Buffer.from('Just plain text without PDF header').toString('base64');

      await assert.rejects(
        async () => {
          await complaintAggregate.uploadAttachment(studentA, complaintA.complaintUuid, {
            fileName: 'fake_report.pdf',
            fileType: 'application/pdf',
            base64Data: fakePdfBase64
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'VAL_INVALID_FILE_CONTENT');
          assert.ok(err.message.includes('PDF'));
          return true;
        }
      );
    });

    it('should accept valid PNG file upload with authentic magic bytes', async () => {
      const validPngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
      ]);
      const validBase64 = validPngBuffer.toString('base64');

      const result = await complaintAggregate.uploadAttachment(studentA, complaintA.complaintUuid, {
        fileName: 'valid_screen_shot.png',
        fileType: 'image/png',
        base64Data: validBase64
      });

      assert.ok(result.attachmentUuid);
      assert.ok(result.url.includes('/storage/local/complaints/'));
    });

    it('should reject file upload with path traversal in fileName', async () => {
      const validPngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64');

      await assert.rejects(
        async () => {
          await complaintAggregate.uploadAttachment(studentA, complaintA.complaintUuid, {
            fileName: '../../etc/passwd.png',
            fileType: 'image/png',
            base64Data: validPngBase64
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.errorCode, 'VAL_INVALID_FILENAME');
          return true;
        }
      );
    });
  });

  // ── 3. Path Traversal & Evidence URL Forgery Prevention ──
  describe('3. Path Traversal & Evidence URL Forgery Prevention', () => {
    it('should reject evidence URLs with directory traversal (..)', () => {
      const traversalUrls = [
        '/storage/../etc/passwd',
        '/storage/local/evidence/../../secret.txt',
        '/uploads/../../windows/system32/cmd.exe'
      ];

      traversalUrls.forEach(url => {
        assert.throws(
          () => complaintAggregate._validateEvidenceUrls([url]),
          /Path traversal sequences are strictly prohibited/
        );
      });
    });

    it('should reject evidence URLs with dangerous unapproved file extensions', () => {
      const executableUrls = [
        '/storage/local/evidence/malware.exe',
        '/storage/local/evidence/exploit.sh',
        '/storage/local/evidence/page.html',
        'https://malicious.org/payload.bat'
      ];

      executableUrls.forEach(url => {
        assert.throws(
          () => complaintAggregate._validateEvidenceUrls([url]),
          /Must be a secure storage path/
        );
      });
    });

    it('should accept strictly validated local and remote HTTPS evidence URLs', () => {
      const validUrls = [
        '/storage/local/evidence/pipe_repaired_123.jpg',
        '/storage/complaints/ac_wire.png',
        '/uploads/evidence/inspection_report.pdf',
        'https://res.cloudinary.com/campus/image/upload/v1234/before_fix.webp'
      ];

      const validated = complaintAggregate._validateEvidenceUrls(validUrls);
      assert.strictEqual(validated.length, 4);
    });
  });

  // ── 4. Server-Side Role-Scoping on Overview Endpoints ──
  describe('4. Server-Side Role Authorization on Overview Endpoints', () => {
    it('should deny unprivileged Student from accessing /institution endpoint (403 Forbidden)', async () => {
      const req = {
        query: {},
        headers: {},
        user: studentA,
        tokenPayload: { roles: ['STUDENT'] }
      };

      let error = null;
      await complaintController.getInstitutionComplaints(req, {}, (err) => { error = err; });
      assert.ok(error, 'Expected 403 Forbidden error');
      assert.strictEqual(error.statusCode, 403);
      assert.strictEqual(error.errorCode, 'FORBIDDEN');
    });

    it('should deny unprivileged Student from accessing /dean-scope endpoint (403 Forbidden)', async () => {
      const req = {
        query: {},
        headers: {},
        user: studentA,
        tokenPayload: { roles: ['STUDENT'] }
      };

      let error = null;
      await complaintController.getDeanScopeComplaints(req, {}, (err) => { error = err; });
      assert.ok(error, 'Expected 403 Forbidden error');
      assert.strictEqual(error.statusCode, 403);
    });

    it('should deny unprivileged Student from accessing /department endpoint (403 Forbidden)', async () => {
      const req = {
        query: {},
        headers: {},
        user: studentA,
        tokenPayload: { roles: ['STUDENT'] }
      };

      let error = null;
      await complaintController.getDepartmentComplaints(req, {}, (err) => { error = err; });
      assert.ok(error, 'Expected 403 Forbidden error');
      assert.strictEqual(error.statusCode, 403);
    });

    it('should deny unprivileged Student from accessing /division endpoint (403 Forbidden)', async () => {
      const req = {
        query: {},
        headers: {},
        user: studentA,
        tokenPayload: { roles: ['STUDENT'] }
      };

      let error = null;
      await complaintController.getDivisionComplaints(req, {}, (err) => { error = err; });
      assert.ok(error, 'Expected 403 Forbidden error');
      assert.strictEqual(error.statusCode, 403);
    });

    it('should allow Principal to access /institution endpoint (200 OK)', async () => {
      const req = {
        query: {},
        headers: {},
        user: principalUser,
        tokenPayload: { roles: ['PRINCIPAL'] }
      };

      let statusCode = null;
      const res = {
        status: (c) => {
          statusCode = c;
          return { json: (b) => b };
        }
      };

      await complaintController.getInstitutionComplaints(req, res, () => {});
      assert.strictEqual(statusCode, 200);
    });
  });

  // ── 5. Principal Approval Enforcement & Concurrency ──
  describe('5. Principal Approval Policy Enforcement & Concurrency Locking', () => {
    let policyComplaint;

    before(async () => {
      policyComplaint = new Complaint({
        complaintUuid: crypto.randomUUID(),
        tenantId: 'tenant_campus_01',
        complaintCode: 'CMP-2026-IT-000102',
        title: 'High-Cost Lab Server Replacement',
        description: 'Requires ₹2,50,000 procurement authorization.',
        categoryCode: 'INFRASTRUCTURE',
        subcategoryCode: 'HARDWARE',
        departmentCode: 'IT',
        divisionCode: '2024-IT-A',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        version: 1,
        createdById: new mongoose.Types.ObjectId(),
        createdByUserUuid: studentA.userUuid,
        createdByName: studentA.fullName,
        createdByEmail: studentA.email,
        assignedToUserUuid: classInchargeUser.userUuid,
        assignedToName: classInchargeUser.fullName,
        assignedToRole: 'CLASS_INCHARGE',
        slaTimers: {
          resolutionSlaDeadline: new Date(Date.now() + 86400000),
          slaWarningThreshold: new Date(Date.now() + 60000000),
          slaBreached: false
        },
        policyApproval: {
          requiresPrincipalApproval: true,
          policyReason: 'Procurement cost exceeds ₹50,000 threshold',
          approvalStatus: 'PENDING_APPROVAL'
        }
      });
      await policyComplaint.save();
    });

    it('should block non-Principal authority from resolving when Principal policy approval is PENDING (403 PRINCIPAL_APPROVAL_REQUIRED)', async () => {
      await assert.rejects(
        async () => {
          await complaintAggregate.executeTransitionWithConcurrency(
            classInchargeUser,
            policyComplaint.complaintUuid,
            'RESOLVED',
            'CI attempting resolution without approval',
            1
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'PRINCIPAL_APPROVAL_REQUIRED');
          return true;
        }
      );
    });

    it('should block resolution when Principal policy approval was explicitly REJECTED (403 POLICY_APPROVAL_REJECTED)', async () => {
      await Complaint.updateOne(
        { complaintUuid: policyComplaint.complaintUuid },
        { 'policyApproval.approvalStatus': 'REJECTED' }
      );

      await assert.rejects(
        async () => {
          await complaintAggregate.executeTransitionWithConcurrency(
            classInchargeUser,
            policyComplaint.complaintUuid,
            'RESOLVED',
            'CI attempting resolution on rejected policy',
            1
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.strictEqual(err.errorCode, 'POLICY_APPROVAL_REJECTED');
          return true;
        }
      );
    });

    it('should reject stale-version concurrent transition requests (409 CONCURRENCY_ERROR)', async () => {
      // First update increments version from 1 to 2
      await complaintAggregate.requestPrincipalApproval(
        classInchargeUser,
        policyComplaint.complaintUuid,
        'Updated policy cost justification',
        1
      );

      // Concurrent request presenting stale version 1 must fail
      await assert.rejects(
        async () => {
          await complaintAggregate.requestPrincipalApproval(
            classInchargeUser,
            policyComplaint.complaintUuid,
            'Concurrent request with stale version',
            1 // Expected version 1, but doc is now version 2!
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 409);
          assert.strictEqual(err.errorCode, 'CONCURRENCY_ERROR');
          return true;
        }
      );
    });

    it('should allow Principal to directly resolve policy-mandated case and record APPROVED decision', async () => {
      const currentDoc = await Complaint.findOne({ complaintUuid: policyComplaint.complaintUuid });
      const resolved = await complaintAggregate.executeTransitionWithConcurrency(
        principalUser,
        policyComplaint.complaintUuid,
        'RESOLVED',
        'Principal executive approval and resolution granted',
        currentDoc.version
      );

      assert.strictEqual(resolved.status, 'RESOLVED');
      assert.strictEqual(resolved.policyApproval.approvalStatus, 'APPROVED');
      assert.strictEqual(resolved.policyApproval.decisionByUserUuid, principalUser.userUuid);
    });
  });

  // ── 6. Production Safety of Debug Endpoints ──
  describe('6. Production Hardening of Administrative Debug Endpoints', () => {
    it('should disable debugEmail endpoint in production environment (403 Forbidden)', async () => {
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const req = { body: { recipient: 'test@college.edu' }, headers: {} };
      let capturedError = null;

      try {
        await registrationController.debugEmail(req, {}, (err) => { capturedError = err; });
        assert.ok(capturedError, 'Expected debugEmail to be blocked in production');
        assert.strictEqual(capturedError.statusCode, 403);
        assert.strictEqual(capturedError.errorCode, 'FORBIDDEN');
      } finally {
        process.env.NODE_ENV = oldEnv;
      }
    });

    it('should disable resetRegistration endpoint in production environment (403 Forbidden)', async () => {
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const req = { body: { email: 'student@college.edu' }, headers: {} };
      let capturedError = null;

      try {
        await registrationController.resetRegistration(req, {}, (err) => { capturedError = err; });
        assert.ok(capturedError, 'Expected resetRegistration to be blocked in production');
        assert.strictEqual(capturedError.statusCode, 403);
        assert.strictEqual(capturedError.errorCode, 'FORBIDDEN');
      } finally {
        process.env.NODE_ENV = oldEnv;
      }
    });
  });
});

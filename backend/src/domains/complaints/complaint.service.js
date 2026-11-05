const crypto = require('crypto');
const mongoose = require('mongoose');
const complaintValidationService = require('./services/complaintValidation.service');
const geminiTriageService = require('../ai/services/geminiTriage.service');
const workflowEngine = require('../workflow/engine/workflowEngine');
const complaintRepository = require('./repositories/complaint.repository');
const ledgerRepository = require('./repositories/ledger.repository');
const idempotencyRepository = require('./repositories/idempotency.repository');
const complaintAggregate = require('./aggregate/ComplaintAggregate');
const eventPublisher = require('../../events/publishers/EventPublisher');
const { AppError } = require('../../shared/errors/AppError');
const { logger } = require('../../config/logger');

const priorityEngine = require('./engine/priorityEngine');
const { StudentProfileSchema, FacultyProfileSchema, OrganizationalAssignmentSchema } = require('../../../../database/schema/schemas');

const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile', FacultyProfileSchema);
const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment', OrganizationalAssignmentSchema);

class ComplaintService {
  async createComplaint(studentUser, payload, options = {}) {
    const startTime = Date.now();
    const { idempotencyKey, traceId = crypto.randomUUID() } = options;

    // 1. Idempotency Check
    if (idempotencyKey) {
      const cached = await idempotencyRepository.findByKey(idempotencyKey, studentUser.userUuid);
      if (cached) {
        logger.info(JSON.stringify({
          traceId,
          userUuid: studentUser.userUuid,
          action: 'ComplaintCreateIdempotentHit',
          idempotencyKey,
          durationMs: Date.now() - startTime
        }));
        return cached.responseData;
      }
    }

    // 2. Input Validation
    const validated = complaintValidationService.validate(payload);
    const { title, description, categoryCode, subcategoryCode } = validated;

    // 3. Resolve Trusted Student Organizational Context (Never trust browser departmentCode)
    let deptCode = studentUser.departmentCode || studentUser.department || 'IT';
    let divCode = studentUser.divisionCode || '2024-IT-A';

    const studentProfile = await StudentProfile.findOne({ userId: studentUser._id });
    if (studentProfile) {
      if (studentProfile.department) deptCode = studentProfile.department.toUpperCase().trim();
      if (studentProfile.division && studentProfile.admissionBatch && studentProfile.department) {
        divCode = `${studentProfile.admissionBatch}-${studentProfile.department}-${studentProfile.division}`;
      } else if (studentProfile.division) {
        divCode = studentProfile.division;
      }
    }

    // 4. AI Triage Analysis (3s Timeout Fallback)
    const aiResult = await geminiTriageService.analyze(description, { departmentHint: deptCode });

    // 5. Automatic Priority Calculation Engine
    const priority = priorityEngine.calculatePriority({
      categoryCode,
      affectedScope: payload.affectedScope || 'MY_CLASS',
      hasSafetyRisk: Boolean(payload.hasSafetyRisk),
      aiPriority: aiResult.priority
    });

    // 6. Workflow Plan Resolution
    const assignmentPlan = workflowEngine.resolveAssignmentPlan(
      categoryCode,
      subcategoryCode,
      studentUser.tenantId,
      deptCode
    );

    // 7. Resolve Handler User UUID via OrganizationalAssignment
    let handlerUserUuid = null;
    let handlerName = assignmentPlan.handlerName;
    let handlerRole = assignmentPlan.handlerRole;

    const User = mongoose.models.User || mongoose.model('User');

    if (assignmentPlan.workflowType === 'OPERATIONAL') {
      deptCode = 'CAMPUS_SERVICES';
      const opsAsgn = await OrganizationalAssignment.findOne({ assignmentType: 'CAMPUS_SERVICES_HEAD', isActive: true });
      if (opsAsgn) {
        if (opsAsgn.assigneeUserUuid) {
          handlerUserUuid = opsAsgn.assigneeUserUuid;
        }
        if (opsAsgn.assigneeUserId) {
          const assigneeUserDoc = await User.findById(opsAsgn.assigneeUserId);
          if (assigneeUserDoc) {
            if (!handlerUserUuid) handlerUserUuid = assigneeUserDoc.userUuid;
            if (assigneeUserDoc.fullName) handlerName = assigneeUserDoc.fullName;
          }
        }
        handlerRole = 'CAMPUS_SERVICES_HEAD';
      }
    } else {
      // Academic Workflow: Find Class Incharge of Student's Division (e.g. '2024-IT-A')
      const classAsgn = await OrganizationalAssignment.findOne({
        scopeId: divCode,
        assignmentType: 'CLASS_INCHARGE',
        isActive: true
      }) || await OrganizationalAssignment.findOne({
        scopeId: deptCode,
        assignmentType: 'HOD',
        isActive: true
      });

      if (classAsgn) {
        if (classAsgn.assigneeUserUuid) {
          handlerUserUuid = classAsgn.assigneeUserUuid;
        }
        if (classAsgn.assigneeUserId) {
          const assigneeUserDoc = await User.findById(classAsgn.assigneeUserId);
          if (assigneeUserDoc) {
            if (!handlerUserUuid) handlerUserUuid = assigneeUserDoc.userUuid;
            if (assigneeUserDoc.fullName) handlerName = assigneeUserDoc.fullName;
          }
        }
        handlerRole = classAsgn.assignmentType || 'CLASS_INCHARGE';
      }
    }

    const complaintUuid = crypto.randomUUID();
    const seqNum = Math.floor(100000 + Math.random() * 900000);
    const complaintCode = `CMP-${new Date().getFullYear()}-${deptCode}-${seqNum}`;

    const now = Date.now();
    const resolutionSlaDeadline = new Date(now + assignmentPlan.slaHours * 60 * 60 * 1000);
    const slaWarningThreshold = new Date(now + Math.floor(assignmentPlan.slaHours * 0.8) * 60 * 60 * 1000);

    const complaintData = {
      tenantId: studentUser.tenantId || 'tenant_campus_01',
      campusId: studentUser.campusId || 'main_campus',
      domainType: assignmentPlan.workflowType || 'ACADEMIC',
      version: 1,
      complaintUuid,
      complaintCode,
      title,
      description,
      categoryCode,
      subcategoryCode,
      departmentCode: deptCode,
      divisionCode: divCode,
      priority,
      status: 'ASSIGNED',
      createdById: studentUser._id,
      createdByUserUuid: studentUser.userUuid,
      createdByName: studentUser.fullName,
      assignedToUserUuid: handlerUserUuid,
      assignedToName: handlerName,
      assignedToRole: handlerRole,
      assignedUserUuids: handlerUserUuid ? [handlerUserUuid] : [],
      currentAssignment: {
        handlerUserUuid,
        handlerName,
        handlerRole,
        departmentCode: deptCode,
        divisionCode: divCode,
        assignedAt: new Date(),
        slaHours: assignmentPlan.slaHours
      },
      assignmentHistory: [{
        handlerUserUuid,
        handlerName,
        handlerRole,
        assignedAt: new Date(),
        reason: 'Initial Workflow Assignment'
      }],
      location: payload.location || {},
      slaTimers: {
        resolutionSlaDeadline,
        slaWarningThreshold,
        slaBreached: false
      }
    };

    // 5. Transaction Ownership (Session owned by ComplaintService)
    // Standalone MongoDB (no replica set) does not support multi-document
    // transactions. Note: startTransaction() does NOT throw on standalone;
    // the error surfaces lazily on the first write inside the transaction.
    // We therefore retry without a session when that specific error occurs.
    const runCreate = async (sess) => {
      const created = await complaintRepository.create(complaintData, sess);
      await ledgerRepository.recordEvent({
        complaintId: created._id,
        complaintUuid,
        eventType: 'COMPLAINT_SUBMITTED',
        actorUuid: studentUser.userUuid,
        actorName: studentUser.fullName,
        newState: 'SUBMITTED',
        note: 'Complaint submitted by student',
        metadata: { aiStatus: aiResult.aiStatus, priority: aiResult.priority }
      }, sess);

      if (handlerUserUuid || handlerName) {
        await ledgerRepository.recordEvent({
          complaintId: created._id,
          complaintUuid,
          eventType: 'COMPLAINT_ASSIGNED',
          actorUuid: 'SYSTEM_WORKFLOW',
          actorName: 'System Workflow Engine',
          previousState: 'SUBMITTED',
          newState: 'ASSIGNED',
          note: `Assigned to ${handlerName || 'Class Incharge'}`,
          metadata: { assignedToUserUuid: handlerUserUuid, assignedToName: handlerName, assignedToRole: handlerRole }
        }, sess);
      }
      // Sync CQRS read-model snapshot so dashboards can list the complaint
      await complaintAggregate.syncSnapshot(created, sess);
      return created;
    };

    let session = null;
    let isSessionStarted = false;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      isSessionStarted = true;
    } catch (txSetupErr) {
      logger.warn(`⚠️ MongoDB standalone environment detected. Transactions disabled; continuing without atomic session. (${txSetupErr.message})`);
      session = null;
    }

    let savedComplaint;
    try {
      try {
        savedComplaint = await runCreate(session);
        if (isSessionStarted && session) {
          await session.commitTransaction();
        }
      } catch (lazyErr) {
        const txUnsupported = /Transaction numbers are only allowed|replica set member/i.test(lazyErr.message || '');
        if (isSessionStarted && session && txUnsupported) {
          logger.warn(`⚠️ Standalone MongoDB detected on first write (${lazyErr.message}); retrying without transaction.`);
          try {
            await session.abortTransaction();
          } catch (abortErr) {
            // ignore — transaction may already be aborted by the driver
          }
          session = null;
          isSessionStarted = false;
          savedComplaint = await runCreate(null);
        } else {
          throw lazyErr;
        }
      }
    } catch (txErr) {
      if (isSessionStarted && session) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          logger.error('Error aborting session transaction:', abortError.message);
        }
      }
      logger.error(JSON.stringify({
        traceId,
        userUuid: studentUser.userUuid,
        action: 'ComplaintCreateTxAborted',
        error: txErr.message
      }));
      throw txErr;
    } finally {
      if (session) {
        session.endSession();
      }
    }

    // 6. Cache Idempotency Key
    if (idempotencyKey) {
      await idempotencyRepository.saveKey(idempotencyKey, studentUser.userUuid, 201, savedComplaint);
    }

    // 7. Publish Async Post-Commit Versioned Domain Event
    await eventPublisher.publish('ComplaintSubmitted', {
      eventType: 'ComplaintSubmitted',
      eventVersion: 1,
      correlationId: traceId,
      occurredAt: new Date().toISOString(),
      payload: {
        complaintUuid: savedComplaint.complaintUuid,
        complaintCode: savedComplaint.complaintCode,
        userUuid: studentUser.userUuid,
        departmentCode: deptCode,
        priority: savedComplaint.priority,
        assignedToUserUuid: assignmentPlan.handlerUserUuid
      }
    });

    const durationMs = Date.now() - startTime;
    logger.info(JSON.stringify({
      traceId,
      complaintUuid: savedComplaint.complaintUuid,
      userUuid: studentUser.userUuid,
      action: 'ComplaintCreated',
      status: 'SUCCESS',
      durationMs
    }));

    return savedComplaint;
  }
}

module.exports = new ComplaintService();

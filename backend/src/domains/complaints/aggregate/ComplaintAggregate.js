const crypto = require('crypto');
const path = require('path');
const mongoose = require('mongoose');
const storageService = require('../../../infrastructure/storage/StorageService');
const complaintAssignmentEngine = require('../services/ComplaintAssignmentEngine');
const workflowEngine = require('../../workflow/engine/workflowEngine');
const eventPublisher = require('../../../events/publishers/EventPublisher');
const {
  ComplaintSchema,
  ComplaintEventLedgerSchema,
  ComplaintCommentSchema,
  ComplaintAttachmentSchema,
  ComplaintSnapshotSchema
} = require('../../../../../database/schema/complaintSchemas');
const { AppError } = require('../../../shared/errors/AppError');
const { assertComplaintAccess } = require('../../../security/complaintAuthorization');
const { logger } = require('../../../config/logger');

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
const ComplaintEventLedger = mongoose.models.ComplaintEventLedger || mongoose.model('ComplaintEventLedger', ComplaintEventLedgerSchema);
const ComplaintComment = mongoose.models.ComplaintComment || mongoose.model('ComplaintComment', ComplaintCommentSchema);
const ComplaintAttachment = mongoose.models.ComplaintAttachment || mongoose.model('ComplaintAttachment', ComplaintAttachmentSchema);
const ComplaintSnapshot = mongoose.models.ComplaintSnapshot || mongoose.model('ComplaintSnapshot', ComplaintSnapshotSchema);

class ComplaintAggregate {

  async syncSnapshot(complaint, session = null) {
    const assignedUserUuids = Array.from(new Set([
      complaint.assignedToUserUuid,
      ...(complaint.assignedUserUuids || []),
      ...(complaint.assignmentHistory ? complaint.assignmentHistory.map(a => a.handlerUserUuid) : [])
    ].filter(Boolean)));

    await ComplaintSnapshot.updateOne(
      { complaintUuid: complaint.complaintUuid },
      {
        $set: {
          tenantId: complaint.tenantId,
          complaintCode: complaint.complaintCode,
          title: complaint.title,
          description: complaint.description,
          categoryCode: complaint.categoryCode,
          domainType: complaint.domainType || (complaint.departmentCode === 'CAMPUS_SERVICES' ? 'OPERATIONAL' : 'ACADEMIC'),
          departmentCode: complaint.departmentCode,
          divisionCode: complaint.divisionCode,
          priority: complaint.priority,
          status: complaint.status,
          createdByUserUuid: complaint.createdByUserUuid,
          createdByName: complaint.createdByName,
          assignedToUserUuid: complaint.assignedToUserUuid || null,
          assignedToName: complaint.assignedToName,
          assignedUserUuids,
          forwardedFromUserUuid: complaint.forwardedFromUserUuid || null,
          forwardedFromName: complaint.forwardedFromName || null,
          resolvedByUserUuid: complaint.resolvedByUserUuid || null,
          resolvedByName: complaint.resolvedByName || null,
          technicianStatus: complaint.technicianAssignment ? complaint.technicianAssignment.status : 'UNASSIGNED',
          technicianName: complaint.technicianAssignment ? complaint.technicianAssignment.technicianName : null,
          technicianTrade: complaint.technicianAssignment ? complaint.technicianAssignment.trade : null,
          requiresPrincipalApproval: complaint.policyApproval ? complaint.policyApproval.requiresPrincipalApproval : false,
          approvalStatus: complaint.policyApproval ? complaint.policyApproval.approvalStatus : 'NOT_REQUIRED',
          resolutionSlaDeadline: complaint.slaTimers ? complaint.slaTimers.resolutionSlaDeadline : null,
          slaBreached: complaint.slaTimers ? complaint.slaTimers.slaBreached : false,
          lastUpdated: new Date()
        }
      },
      { upsert: true, session }
    );
  }

  async recordLedgerEvent(complaint, eventType, actorUser, previousState, newState, note = '', metadata = {}, session = null) {
    const ledgerUuid = crypto.randomUUID();
    const ledgerDoc = new ComplaintEventLedger({
      ledgerUuid,
      complaintId: complaint._id,
      complaintUuid: complaint.complaintUuid,
      eventType,
      actorUuid: actorUser.userUuid,
      actorName: actorUser.fullName,
      previousState,
      newState,
      note,
      metadata,
      timestamp: new Date()
    });

    await ledgerDoc.save({ session });
    return ledgerDoc;
  }

  async submitComplaint(studentUser, complaintData, session = null) {
    const { title, description, categoryCode, subcategoryCode, priority, location, departmentHint, divisionCode } = complaintData;
    const deptCode = departmentHint || 'CSE';
    const division = divisionCode || studentUser.divisionCode || (deptCode === 'CAMPUS_SERVICES' ? null : '2024-IT-A');

    // 1. Resolve Dynamic Assignment & SLA Timers
    const assignment = await complaintAssignmentEngine.determineAssignment(
      categoryCode,
      subcategoryCode,
      studentUser.tenantId,
      deptCode,
      division
    );

    const complaintUuid = crypto.randomUUID();
    const seqNum = Math.floor(100000 + Math.random() * 900000);
    const complaintCode = `CMP-${new Date().getFullYear()}-${deptCode}-${seqNum}`;
    
    const now = Date.now();
    const resolutionSlaDeadline = new Date(now + assignment.slaHours * 60 * 60 * 1000);
    const slaWarningThreshold = new Date(now + Math.floor(assignment.slaHours * 0.8) * 60 * 60 * 1000);

    const initialStatus = assignment.assignedToUserUuid || assignment.assignedToName ? 'ASSIGNED' : 'SUBMITTED';

    // 2. Build Complaint Document Root (version = 1)
    const complaintDoc = new Complaint({
      tenantId: studentUser.tenantId || 'tenant_campus_01',
      campusId: studentUser.campusId || 'main_campus',
      version: 1,
      complaintUuid,
      complaintCode,
      title: title.trim(),
      description: description.trim(),
      categoryCode: categoryCode.toUpperCase().trim(),
      subcategoryCode: subcategoryCode.toUpperCase().trim(),
      domainType: complaintData.domainType || (deptCode === 'CAMPUS_SERVICES' ? 'OPERATIONAL' : 'ACADEMIC'),
      departmentCode: deptCode,
      divisionCode: division,
      priority: priority ? priority.toUpperCase().trim() : 'MEDIUM',
      status: initialStatus,
      createdById: studentUser._id,
      createdByUserUuid: studentUser.userUuid,
      createdByName: studentUser.fullName,
      assignedToUserUuid: assignment.assignedToUserUuid,
      assignedToName: assignment.assignedToName,
      assignedToRole: assignment.assignedToRole,
      assignedUserUuids: assignment.assignedToUserUuid ? [assignment.assignedToUserUuid] : [],
      location: location || {},
      slaHours: assignment.slaHours,
      slaTimers: {
        resolutionSlaDeadline,
        slaWarningThreshold,
        slaBreached: false
      }
    });

    const savedComplaint = await complaintDoc.save({ session });

    // 3. Append Ledger Events
    await this.recordLedgerEvent(savedComplaint, 'COMPLAINT_SUBMITTED', studentUser, null, 'SUBMITTED', 'Complaint submitted by student', {}, session);
    if (initialStatus === 'ASSIGNED') {
      await this.recordLedgerEvent(savedComplaint, 'COMPLAINT_ASSIGNED', studentUser, 'SUBMITTED', 'ASSIGNED', `Assigned to ${assignment.assignedToName}`, {}, session);
    }

    // 4. Update CQRS Snapshot
    await this.syncSnapshot(savedComplaint, session);

    // 5. Emit Domain Events
    await eventPublisher.publish('ComplaintSubmitted', {
      complaintUuid: savedComplaint.complaintUuid,
      complaintCode: savedComplaint.complaintCode,
      userUuid: studentUser.userUuid,
      departmentCode: deptCode,
      priority: savedComplaint.priority,
      resolutionSlaDeadline,
      occurredAt: new Date().toISOString()
    });

    return savedComplaint;
  }

  async executeAction(actorUser, complaintUuid, action, note = '', expectedVersion = null, session = null) {
    const ACTION_MAP = {
      'FORWARD': 'FORWARDED',
      'FORWARDED': 'FORWARDED',
      'ESCALATE': 'ESCALATED',
      'ESCALATED': 'ESCALATED',
      'RESOLVE': 'RESOLVED',
      'RESOLVED': 'RESOLVED',
      'CLOSE': 'CLOSED',
      'CLOSED': 'CLOSED',
      'REJECT': 'REJECTED',
      'REJECTED': 'REJECTED',
      'RETURN_FOR_CORRECTION': 'RETURNED_FOR_CORRECTION',
      'RETURNED_FOR_CORRECTION': 'RETURNED_FOR_CORRECTION',
      'SUBMIT': 'SUBMITTED',
      'SUBMITTED': 'SUBMITTED',
      'REOPEN': 'REOPENED',
      'REOPENED': 'REOPENED'
    };
    const targetState = ACTION_MAP[String(action).toUpperCase().trim()] || String(action).toUpperCase().trim();
    return this.executeTransitionWithConcurrency(actorUser, complaintUuid, targetState, note, expectedVersion, session);
  }

  async executeTransitionWithConcurrency(actorUser, complaintUuid, targetState, note = '', expectedVersion = null, session = null) {
    const complaint = await Complaint.findOne({ complaintUuid, isDeleted: false }).session(session);
    if (!complaint) {
      throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
    }

    // Optimistic Concurrency Lock Check
    if (expectedVersion !== null && complaint.version !== Number(expectedVersion)) {
      throw new AppError('Concurrency Conflict: Complaint state has been modified by another user. Please refresh.', 409, 'CONCURRENCY_ERROR');
    }

    // Role / Identity Authorization Enforcement
    const userRoles = actorUser.roles || (actorUser.primaryRole ? [actorUser.primaryRole] : []);
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isPrincipal = userRoles.includes('PRINCIPAL') || actorUser.primaryRole === 'PRINCIPAL';

    if (complaint.status === 'RESOLVED') {
      if (complaint.createdByUserUuid !== actorUser.userUuid) {
        throw new AppError('Only the student who submitted this complaint can accept the resolution or request reconsideration.', 403, 'FORBIDDEN');
      }
    } else if (complaint.status === 'RETURNED_FOR_CORRECTION') {
      if (complaint.createdByUserUuid !== actorUser.userUuid && !isSuperAdmin) {
        throw new AppError('Only the student who submitted this complaint can resubmit after correction.', 403, 'FORBIDDEN');
      }
    } else {
      const isAssigned = complaint.assignedToUserUuid === actorUser.userUuid;
      const isPrivileged = isPrincipal || isSuperAdmin || (userRoles.includes('ADMIN') && complaint.departmentCode === 'CAMPUS_SERVICES');
      if (complaint.assignedToUserUuid && !isAssigned && !isPrivileged) {
        throw new AppError('Unauthorized: You are not currently assigned to execute actions on this complaint.', 403, 'FORBIDDEN');
      }
    }

    const previousState = complaint.status;

    // State Machine Invariant Check
    workflowEngine.validateTransition(previousState, targetState);

    // Execute Mutation via Version Incrementation
    const updates = {
      status: targetState,
      $inc: { version: 1 }
    };

    // Policy Approval Enforcement on Resolution / Closure
    if (['RESOLVED', 'CLOSED'].includes(targetState)) {
      const isActorPrincipal = (actorUser.roles && actorUser.roles.includes('PRINCIPAL')) || actorUser.primaryRole === 'PRINCIPAL';
      if (complaint.policyApproval && complaint.policyApproval.requiresPrincipalApproval) {
        if (complaint.policyApproval.approvalStatus === 'REJECTED') {
          throw new AppError('Policy approval was REJECTED by the Principal. This complaint cannot be resolved under the current policy.', 403, 'POLICY_APPROVAL_REJECTED');
        }
        if (complaint.policyApproval.approvalStatus !== 'APPROVED') {
          if (!isActorPrincipal) {
            throw new AppError('This complaint requires mandatory Principal policy approval before resolution/closure.', 403, 'PRINCIPAL_APPROVAL_REQUIRED');
          } else {
            // Principal resolving directly satisfies policy approval requirement
            updates['policyApproval.approvalStatus'] = 'APPROVED';
            updates['policyApproval.decisionByUserUuid'] = actorUser.userUuid;
            updates['policyApproval.decisionByName'] = actorUser.fullName;
            updates['policyApproval.decisionNotes'] = note || 'Approved via Principal Resolution';
            updates['policyApproval.decisionAt'] = new Date();
          }
        }
      }
    }

    if (targetState === 'RESOLVED') {
      updates.resolvedAt = new Date();
      updates.resolvedByUserUuid = actorUser.userUuid;
      updates.resolvedByName = actorUser.fullName;
    }
    if (targetState === 'CLOSED') updates.closedAt = new Date();

    if (targetState === 'REJECTED') {
      if (!note || !note.trim()) {
        throw new AppError('A valid rejection reason is required before rejecting a complaint.', 400, 'VAL_REJECTION_REASON');
      }
      updates.rejectionDetails = {
        rejectedByUserUuid: actorUser.userUuid,
        rejectedByName: actorUser.fullName,
        rejectedByRole: actorUser.primaryRole || (actorUser.roles && actorUser.roles[0]) || 'STAFF',
        reason: note.trim(),
        rejectedAt: new Date()
      };
    }

    if (targetState === 'RETURNED_FOR_CORRECTION') {
      if (!note || !note.trim()) {
        throw new AppError('Specific correction instructions are required when returning a complaint to the student.', 400, 'VAL_CORRECTION_INSTRUCTIONS');
      }
      updates.correctionDetails = {
        returnedByUserUuid: actorUser.userUuid,
        returnedByName: actorUser.fullName,
        returnedByRole: actorUser.primaryRole || (actorUser.roles && actorUser.roles[0]) || 'STAFF',
        instructions: note.trim(),
        returnedAt: new Date()
      };
    }

    if (targetState === 'SUBMITTED' && previousState === 'RETURNED_FOR_CORRECTION') {
      // Re-submitted by student after correcting
      updates.status = complaint.assignedToUserUuid ? 'ASSIGNED' : 'SUBMITTED';
    }

    // Workflow Handler Resolution for FORWARDED & ESCALATED
    const User = mongoose.models.User || mongoose.model('User');
    const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile');
    const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment');

    if (targetState === 'FORWARDED') {
      const tgAsgn = await OrganizationalAssignment.findOne({
        scopeId: complaint.divisionCode || '2024-IT-A',
        assignmentType: 'TEACHER_GUARDIAN',
        isActive: true
      }) || await OrganizationalAssignment.findOne({
        assignmentType: 'TEACHER_GUARDIAN',
        isActive: true
      });

      if (!tgAsgn) {
        throw new AppError(`No Teacher Guardian assigned to division '${complaint.divisionCode || '2024-IT-A'}'.`, 409, 'NO_HANDLER_ASSIGNED');
      }

      let handlerUuid = tgAsgn.assigneeUserUuid;
      if (!handlerUuid && tgAsgn.assigneeUserId) {
        const u = await User.findById(tgAsgn.assigneeUserId);
        if (u) handlerUuid = u.userUuid;
      }
      let handlerName = 'Teacher Guardian';
      const staffProf = await FacultyProfile.findOne({ userId: tgAsgn.assigneeUserId });
      if (staffProf) handlerName = staffProf.fullName;

      updates.assignedToUserUuid = handlerUuid;
      updates.assignedToName = handlerName;
      updates.assignedToRole = 'TEACHER_GUARDIAN';
      updates.forwardedFromUserUuid = actorUser.userUuid;
      updates.forwardedFromName = actorUser.fullName;
      updates.currentAssignment = {
        handlerUserUuid: handlerUuid,
        handlerName,
        handlerRole: 'TEACHER_GUARDIAN',
        departmentCode: complaint.departmentCode,
        divisionCode: complaint.divisionCode,
        assignedAt: new Date()
      };
      updates.$addToSet = { assignedUserUuids: handlerUuid };
      updates.$push = {
        assignmentHistory: {
          handlerUserUuid: handlerUuid,
          handlerName,
          handlerRole: 'TEACHER_GUARDIAN',
          assignedAt: new Date(),
          reason: note || 'Forwarded to Teacher Guardian'
        }
      };
    } else if (targetState === 'ESCALATED') {
      const currentRole = complaint.assignedToRole || (complaint.currentAssignment && complaint.currentAssignment.handlerRole) || 'CLASS_INCHARGE';
      let targetRole = 'HOD';

      // ── Appeal / Reconsideration from RESOLVED ──
      if (previousState === 'RESOLVED') {
        if (currentRole === 'PRINCIPAL') {
          throw new AppError('Principal resolution is the apex institutional decision. No further reconsideration levels exist.', 400, 'APEX_RESOLUTION_FINAL');
        } else if (currentRole === 'CLASS_INCHARGE' || currentRole === 'FACULTY') {
          targetRole = 'TEACHER_GUARDIAN';
        } else if (currentRole === 'TEACHER_GUARDIAN') {
          targetRole = 'HOD';
        } else if (currentRole === 'HOD') {
          targetRole = 'DEAN';
        } else if (currentRole === 'DEAN' || currentRole === 'CAMPUS_SERVICES_HEAD') {
          targetRole = 'PRINCIPAL';
        }
        // Reset resolution fields on aggregate root (history is preserved in ledger & assignmentHistory)
        updates.resolvedByUserUuid = null;
        updates.resolvedByName = null;
        updates.resolvedAt = null;
      } else {
        // ── Standard Staff Escalation ──
        if (currentRole === 'PRINCIPAL') {
          throw new AppError('Principal is the terminal authority. No further escalation levels exist.', 400, 'TERMINAL_ESCALATION_LEVEL');
        } else if (currentRole === 'TEACHER_GUARDIAN' || currentRole === 'CLASS_INCHARGE') {
          targetRole = 'HOD';
        } else if (currentRole === 'HOD') {
          targetRole = 'DEAN';
        } else if (currentRole === 'DEAN' || currentRole === 'CAMPUS_SERVICES_HEAD') {
          targetRole = 'PRINCIPAL';
        }
      }

      let nextAsgn = null;
      if (targetRole === 'TEACHER_GUARDIAN') {
        nextAsgn = await OrganizationalAssignment.findOne({
          scopeId: complaint.divisionCode || '2024-IT-A',
          assignmentType: 'TEACHER_GUARDIAN',
          isActive: true
        }) || await OrganizationalAssignment.findOne({
          assignmentType: 'TEACHER_GUARDIAN',
          isActive: true
        });
      } else if (targetRole === 'HOD') {
        nextAsgn = await OrganizationalAssignment.findOne({
          scopeId: complaint.departmentCode,
          assignmentType: 'HOD',
          isActive: true
        }) || await OrganizationalAssignment.findOne({
          assignmentType: 'HOD',
          isActive: true
        });
      } else if (targetRole === 'DEAN') {
        nextAsgn = await OrganizationalAssignment.findOne({
          assignmentType: 'DEAN',
          isActive: true
        }) || await OrganizationalAssignment.findOne({
          scopeId: 'ACADEMICS',
          assignmentType: 'DEAN',
          isActive: true
        });
      } else if (targetRole === 'PRINCIPAL') {
        nextAsgn = await OrganizationalAssignment.findOne({
          assignmentType: 'PRINCIPAL',
          isActive: true
        });
      }

      let handlerUuid = null;
      let handlerName = targetRole;

      if (nextAsgn) {
        handlerUuid = nextAsgn.assigneeUserUuid;
        if (!handlerUuid && nextAsgn.assigneeUserId) {
          const u = await User.findById(nextAsgn.assigneeUserId);
          if (u) handlerUuid = u.userUuid;
        }
        if (!handlerUuid && nextAsgn.assigneeLoginId) {
          const u = await User.findOne({ loginId: nextAsgn.assigneeLoginId });
          if (u) handlerUuid = u.userUuid;
        }
        const staffProf = await FacultyProfile.findOne({ userId: nextAsgn.assigneeUserId });
        if (staffProf && staffProf.fullName) handlerName = staffProf.fullName;
      }

      if (!handlerUuid) {
        const fallbackUser = await User.findOne({ roles: targetRole, isDeleted: false });
        if (fallbackUser) {
          handlerUuid = fallbackUser.userUuid;
          handlerName = fallbackUser.fullName || targetRole;
        }
      }

      if (!handlerUuid) {
        throw new AppError(`No active ${targetRole} assigned to handle escalation.`, 409, 'NO_HANDLER_ASSIGNED');
      }

      const escalationReason = previousState === 'RESOLVED'
        ? `Reconsideration requested by student: "${note || 'Resolution unsatisfactory'}"`
        : (note || `Escalated to ${targetRole}`);

      updates.assignedToUserUuid = handlerUuid;
      updates.assignedToName = handlerName;
      updates.assignedToRole = targetRole;
      updates.currentAssignment = {
        handlerUserUuid: handlerUuid,
        handlerName,
        handlerRole: targetRole,
        departmentCode: complaint.departmentCode,
        divisionCode: complaint.divisionCode,
        assignedAt: new Date()
      };
      updates.$addToSet = { assignedUserUuids: handlerUuid };
      updates.$push = {
        assignmentHistory: {
          handlerUserUuid: handlerUuid,
          handlerName,
          handlerRole: targetRole,
          assignedAt: new Date(),
          reason: escalationReason
        }
      };
    }

    const updateQuery = { complaintUuid, isDeleted: false };
    if (expectedVersion !== null) updateQuery.version = Number(expectedVersion);

    const result = await Complaint.findOneAndUpdate(updateQuery, updates, { new: true, session });
    if (!result) {
      throw new AppError('Concurrency Conflict: State update aborted due to concurrent modification.', 409, 'CONCURRENCY_ERROR');
    }

    // Record Event Ledger Entry
    const eventType = targetState === 'FORWARDED' ? 'COMPLAINT_FORWARDED' : `COMPLAINT_${targetState}`;
    await this.recordLedgerEvent(result, eventType, actorUser, previousState, targetState, note, {}, session);

    // Sync CQRS Snapshot
    await this.syncSnapshot(result, session);

    // Emit Domain Event
    await eventPublisher.publish(`Complaint${targetState.charAt(0) + targetState.slice(1).toLowerCase()}`, {
      complaintUuid: result.complaintUuid,
      complaintCode: result.complaintCode,
      previousState,
      newState: targetState,
      actorUuid: actorUser.userUuid,
      occurredAt: new Date().toISOString()
    });

    return result;
  }

  async addComment(actorUser, complaintUuid, message, commentType = 'PUBLIC') {
    const complaint = await Complaint.findOne({ complaintUuid, isDeleted: false });
    if (!complaint) {
      throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
    }

    // Role, Ownership & Department Authorization
    assertComplaintAccess(actorUser, complaint, 'COMMENT');

    const commentUuid = crypto.randomUUID();
    const commentDoc = new ComplaintComment({
      commentUuid,
      complaintId: complaint._id,
      complaintUuid: complaint.complaintUuid,
      authorUuid: actorUser.userUuid,
      authorName: actorUser.fullName,
      commentType: commentType.toUpperCase().trim(),
      message: message.trim(),
      timestamp: new Date()
    });

    const savedComment = await commentDoc.save();

    await this.recordLedgerEvent(complaint, 'COMMENT_ADDED', actorUser, complaint.status, complaint.status, `Comment added (${commentType})`, { commentUuid });

    await eventPublisher.publish('CommentAdded', {
      complaintUuid: complaint.complaintUuid,
      commentUuid,
      authorUuid: actorUser.userUuid,
      commentType,
      occurredAt: new Date().toISOString()
    });

    return savedComment;
  }

  async overridePriority(actorUser, complaintUuid, newPriority, reason = '') {
    const primaryRole = actorUser.primaryRole || (actorUser.roles && actorUser.roles[0]) || 'STUDENT';
    if (primaryRole === 'STUDENT' || actorUser.profileType === 'STUDENT') {
      throw new AppError('Students are not permitted to change complaint priority.', 403, 'FORBIDDEN');
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      throw new AppError('A valid justification reason (at least 10 characters) is required to override priority.', 400, 'VAL_REASON_REQUIRED');
    }

    const complaint = await Complaint.findOne({ complaintUuid, isDeleted: false });
    if (!complaint) {
      throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
    }

    // Role, Ownership & Department Authorization
    assertComplaintAccess(actorUser, complaint, 'OVERRIDE_PRIORITY');

    const previousPriority = complaint.priority;
    const targetPriority = newPriority.toUpperCase().trim();

    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(targetPriority)) {
      throw new AppError(`Invalid priority level '${targetPriority}'.`, 400, 'VAL_INVALID_PRIORITY');
    }

    complaint.priority = targetPriority;
    complaint.version += 1;
    await complaint.save();

    await this.recordLedgerEvent(
      complaint,
      'COMPLAINT_PRIORITY_CHANGED',
      actorUser,
      complaint.status,
      complaint.status,
      reason.trim(),
      { previousPriority, targetPriority, changedByRole: primaryRole }
    );

    await this.syncSnapshot(complaint);

    await eventPublisher.publish('PriorityOverridden', {
      complaintUuid: complaint.complaintUuid,
      previousPriority,
      newPriority: targetPriority,
      actorUuid: actorUser.userUuid,
      reason: reason.trim(),
      occurredAt: new Date().toISOString()
    });

    return complaint;
  }

  _validateEvidenceUrls(urls) {
    if (!urls || !Array.isArray(urls)) return [];
    // Strict URL pattern preventing path traversal (..), non-whitelisted paths, or dangerous file extensions
    const localStoragePattern = /^\/storage\/(local\/)?([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp|pdf)$/i;
    const legacyUploadPattern = /^\/uploads\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp|pdf)$/i;
    const httpsPattern = /^https:\/\/[a-zA-Z0-9_.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9_.-]+)*\.(jpg|jpeg|png|webp|pdf)$/i;

    for (const url of urls) {
      if (typeof url !== 'string' || url.includes('..') || url.includes('\\')) {
        throw new AppError(`Invalid evidence reference '${url}'. Path traversal sequences are strictly prohibited.`, 400, 'VAL_INVALID_EVIDENCE_URL');
      }
      const trimmed = url.trim();
      const isValid = localStoragePattern.test(trimmed) || legacyUploadPattern.test(trimmed) || httpsPattern.test(trimmed);
      if (!isValid) {
        throw new AppError(`Invalid evidence reference '${url}'. Must be a secure storage path (/storage/local/evidence/...) or valid HTTPS image/document URL (.jpg, .jpeg, .png, .webp, .pdf).`, 400, 'VAL_INVALID_EVIDENCE_URL');
      }
    }
    return urls.map(u => u.trim());
  }

  async assignTechnician(actorUser, complaintUuid, technicianData, expectedVersion = null, session = null) {
    const roles = actorUser.roles || (actorUser.primaryRole ? [actorUser.primaryRole] : []);
    const isStudent = roles.includes('STUDENT') && roles.length === 1 && !actorUser.roles?.some(r => r !== 'STUDENT');
    if (isStudent && actorUser.profileType === 'STUDENT') {
      throw new AppError('Students are not authorized to assign technicians.', 403, 'FORBIDDEN');
    }

    const { technicianUserUuid, technicianName, trade, notes } = technicianData || {};
    if (!technicianUserUuid || !technicianName || !trade) {
      throw new AppError('Technician UUID, technician name, and trade specialization are required.', 400, 'VAL_TECHNICIAN_REQUIRED');
    }

    const complaint = await Complaint.findOne({ complaintUuid, isDeleted: false }).session(session);
    if (!complaint) {
      throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
    }

    if (expectedVersion !== null && complaint.version !== Number(expectedVersion)) {
      throw new AppError('Concurrency Conflict: Complaint has been modified by another user.', 409, 'CONCURRENCY_ERROR');
    }

    const updates = {
      technicianAssignment: {
        technicianUserUuid,
        technicianName: technicianName.trim(),
        trade: trade.toUpperCase().trim(),
        status: 'DISPATCHED',
        assignedAt: new Date(),
        startedAt: null,
        resolvedAt: null,
        resolutionNotes: '',
        evidenceUrls: []
      },
      $inc: { version: 1 }
    };

    const updateQuery = { complaintUuid, isDeleted: false };
    if (expectedVersion !== null) updateQuery.version = Number(expectedVersion);

    const updated = await Complaint.findOneAndUpdate(updateQuery, updates, { new: true, session });
    if (!updated) {
      throw new AppError('Concurrency Conflict: Technician assignment aborted.', 409, 'CONCURRENCY_ERROR');
    }

    await this.recordLedgerEvent(
      updated,
      'TECHNICIAN_ASSIGNED',
      actorUser,
      complaint.status,
      complaint.status,
      notes || `Technician ${technicianName} (${trade}) dispatched for physical inspection/repair.`,
      { technicianUserUuid, technicianName, trade: trade.toUpperCase().trim() },
      session
    );

    await this.syncSnapshot(updated, session);

    await eventPublisher.publish('TechnicianAssigned', {
      complaintUuid: updated.complaintUuid,
      technicianUserUuid,
      technicianName,
      trade,
      assignedBy: actorUser.userUuid,
      occurredAt: new Date().toISOString()
    });

    return updated;
  }

  async updateTechnicianWork(technicianUser, complaintUuid, workData, expectedVersion = null, session = null) {
    const { status, resolutionNotes = '', evidenceUrls = [] } = workData || {};
    const validStatuses = ['IN_PROGRESS', 'RESOLVED'];

    const targetStatus = String(status || '').toUpperCase().trim();
    if (!validStatuses.includes(targetStatus)) {
      throw new AppError(`Invalid technician status '${status}'. Must be 'IN_PROGRESS' or 'RESOLVED'.`, 400, 'VAL_INVALID_TECH_STATUS');
    }

    const complaint = await Complaint.findOne({ complaintUuid, isDeleted: false }).session(session);
    if (!complaint) {
      throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
    }

    const currentTechUuid = complaint.technicianAssignment?.technicianUserUuid;
    const userRoles = technicianUser.roles || (technicianUser.primaryRole ? [technicianUser.primaryRole] : []);
    const isPrivilegedStaff = userRoles.some(r => ['ADMIN', 'SUPER_ADMIN', 'CAMPUS_SERVICES_HEAD'].includes(r));

    if (currentTechUuid !== technicianUser.userUuid && !isPrivilegedStaff) {
      throw new AppError('Unauthorized: You are not the assigned technician for this complaint.', 403, 'FORBIDDEN');
    }

    if (expectedVersion !== null && complaint.version !== Number(expectedVersion)) {
      throw new AppError('Concurrency Conflict: Complaint has been modified by another user.', 409, 'CONCURRENCY_ERROR');
    }

    const sanitizedEvidence = this._validateEvidenceUrls(evidenceUrls);

    if (targetStatus === 'RESOLVED' && (!resolutionNotes || resolutionNotes.trim().length < 5)) {
      throw new AppError('Detailed resolution notes (at least 5 characters) are required upon completing repair work.', 400, 'VAL_RESOLUTION_NOTES_REQUIRED');
    }

    const existingAssignment = complaint.technicianAssignment ? complaint.technicianAssignment.toObject() : {};
    const updatedAssignment = {
      ...existingAssignment,
      status: targetStatus,
      resolutionNotes: resolutionNotes.trim() || existingAssignment.resolutionNotes || '',
      evidenceUrls: Array.from(new Set([...(existingAssignment.evidenceUrls || []), ...sanitizedEvidence]))
    };

    if (targetStatus === 'IN_PROGRESS' && !existingAssignment.startedAt) {
      updatedAssignment.startedAt = new Date();
    }
    if (targetStatus === 'RESOLVED') {
      updatedAssignment.resolvedAt = new Date();
    }

    const updates = {
      technicianAssignment: updatedAssignment,
      $inc: { version: 1 }
    };

    const updateQuery = { complaintUuid, isDeleted: false };
    if (expectedVersion !== null) updateQuery.version = Number(expectedVersion);

    const updated = await Complaint.findOneAndUpdate(updateQuery, updates, { new: true, session });
    if (!updated) {
      throw new AppError('Concurrency Conflict: Technician work update aborted.', 409, 'CONCURRENCY_ERROR');
    }

    const eventType = targetStatus === 'RESOLVED' ? 'TECHNICIAN_COMPLETED' : 'TECHNICIAN_STATUS_UPDATED';
    await this.recordLedgerEvent(
      updated,
      eventType,
      technicianUser,
      complaint.status,
      complaint.status, // Authority complaint status remains unchanged!
      resolutionNotes || `Technician physical repair status updated to '${targetStatus}'.`,
      {
        technicianUserUuid: technicianUser.userUuid,
        technicianName: technicianUser.fullName,
        technicianStatus: targetStatus,
        evidenceCount: sanitizedEvidence.length
      },
      session
    );

    await this.syncSnapshot(updated, session);

    await eventPublisher.publish(eventType === 'TECHNICIAN_COMPLETED' ? 'TechnicianWorkCompleted' : 'TechnicianWorkUpdated', {
      complaintUuid: updated.complaintUuid,
      technicianUserUuid: technicianUser.userUuid,
      technicianStatus: targetStatus,
      occurredAt: new Date().toISOString()
    });

    return updated;
  }

  async requestPrincipalApproval(actorUser, complaintUuid, policyReason, expectedVersion = null, session = null) {
    if (!policyReason || typeof policyReason !== 'string' || policyReason.trim().length < 5) {
      throw new AppError('A valid policy justification reason (at least 5 characters) is required to request Principal approval.', 400, 'VAL_POLICY_REASON_REQUIRED');
    }

    const roles = actorUser.roles || (actorUser.primaryRole ? [actorUser.primaryRole] : []);
    const isAuthorized = roles.some(r => ['HOD', 'DEAN', 'CAMPUS_SERVICES_HEAD', 'ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(r));
    if (!isAuthorized) {
      throw new AppError('Only leadership and department heads can mandate Principal policy approval.', 403, 'FORBIDDEN');
    }

    const complaint = await Complaint.findOne({ complaintUuid, isDeleted: false }).session(session);
    if (!complaint) {
      throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
    }

    if (expectedVersion !== null && complaint.version !== Number(expectedVersion)) {
      throw new AppError('Concurrency Conflict: Complaint has been modified by another user.', 409, 'CONCURRENCY_ERROR');
    }

    const updates = {
      policyApproval: {
        requiresPrincipalApproval: true,
        policyReason: policyReason.trim(),
        approvalStatus: 'PENDING_APPROVAL',
        decisionByUserUuid: null,
        decisionByName: null,
        decisionNotes: null,
        decisionAt: null
      },
      $inc: { version: 1 }
    };

    const updateQuery = { complaintUuid, isDeleted: false };
    if (expectedVersion !== null) updateQuery.version = Number(expectedVersion);

    const updated = await Complaint.findOneAndUpdate(updateQuery, updates, { new: true, session });
    if (!updated) {
      throw new AppError('Concurrency Conflict: Request for Principal approval aborted.', 409, 'CONCURRENCY_ERROR');
    }

    await this.recordLedgerEvent(
      updated,
      'PRINCIPAL_APPROVAL_REQUESTED',
      actorUser,
      complaint.status,
      complaint.status,
      `Principal policy approval mandated: "${policyReason.trim()}"`,
      { requestedByUserUuid: actorUser.userUuid, policyReason: policyReason.trim() },
      session
    );

    await this.syncSnapshot(updated, session);

    await eventPublisher.publish('PrincipalApprovalRequested', {
      complaintUuid: updated.complaintUuid,
      requestedBy: actorUser.userUuid,
      policyReason: policyReason.trim(),
      occurredAt: new Date().toISOString()
    });

    return updated;
  }

  async decidePrincipalApproval(principalUser, complaintUuid, { decision, decisionNotes = '' }, expectedVersion = null, session = null) {
    const roles = principalUser.roles || (principalUser.primaryRole ? [principalUser.primaryRole] : []);
    const isPrincipal = roles.includes('PRINCIPAL') || principalUser.primaryRole === 'PRINCIPAL' || roles.includes('SUPER_ADMIN');
    if (!isPrincipal) {
      throw new AppError('Only the Principal is authorized to grant or reject policy approvals.', 403, 'FORBIDDEN');
    }

    const upperDecision = String(decision || '').toUpperCase().trim();
    if (!['APPROVED', 'REJECTED'].includes(upperDecision)) {
      throw new AppError(`Invalid approval decision '${decision}'. Must be 'APPROVED' or 'REJECTED'.`, 400, 'VAL_INVALID_DECISION');
    }

    const complaint = await Complaint.findOne({ complaintUuid, isDeleted: false }).session(session);
    if (!complaint) {
      throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
    }

    if (expectedVersion !== null && complaint.version !== Number(expectedVersion)) {
      throw new AppError('Concurrency Conflict: Complaint has been modified by another user.', 409, 'CONCURRENCY_ERROR');
    }

    const existingPolicy = complaint.policyApproval ? complaint.policyApproval.toObject() : {};
    const updates = {
      policyApproval: {
        ...existingPolicy,
        approvalStatus: upperDecision,
        decisionByUserUuid: principalUser.userUuid,
        decisionByName: principalUser.fullName,
        decisionNotes: decisionNotes ? decisionNotes.trim() : '',
        decisionAt: new Date()
      },
      $inc: { version: 1 }
    };

    const updateQuery = { complaintUuid, isDeleted: false };
    if (expectedVersion !== null) updateQuery.version = Number(expectedVersion);

    const updated = await Complaint.findOneAndUpdate(updateQuery, updates, { new: true, session });
    if (!updated) {
      throw new AppError('Concurrency Conflict: Decision recording aborted.', 409, 'CONCURRENCY_ERROR');
    }

    const eventType = upperDecision === 'APPROVED' ? 'PRINCIPAL_APPROVED' : 'PRINCIPAL_REJECTED';
    await this.recordLedgerEvent(
      updated,
      eventType,
      principalUser,
      complaint.status,
      complaint.status,
      `Principal policy decision: ${upperDecision}. ${decisionNotes || ''}`.trim(),
      { decision: upperDecision, decisionNotes },
      session
    );

    await this.syncSnapshot(updated, session);

    await eventPublisher.publish('PrincipalApprovalDecided', {
      complaintUuid: updated.complaintUuid,
      decision: upperDecision,
      decidedBy: principalUser.userUuid,
      occurredAt: new Date().toISOString()
    });

    return updated;
  }

  async uploadAttachment(actorUser, complaintUuid, { fileName, fileType, base64Data, isEvidence = false }, session = null) {
    if (!fileName || !base64Data) {
      throw new AppError('fileName and base64Data are required for attachment upload.', 400, 'VAL_ATTACHMENT_REQUIRED');
    }

    // Prevent Path Traversal and Safe Filename enforcement
    if (typeof fileName !== 'string' || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\') || fileName.includes('\0')) {
      throw new AppError('Filename contains invalid path traversal characters.', 400, 'VAL_INVALID_FILENAME');
    }

    const complaint = await Complaint.findOne({ complaintUuid, isDeleted: false }).session(session);
    if (!complaint) {
      throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
    }

    // Role, Ownership & Department Authorization
    assertComplaintAccess(actorUser, complaint, 'ATTACHMENT');

    const ext = path.extname(fileName).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    if (!allowedExtensions.includes(ext)) {
      throw new AppError(`Invalid file format '${ext}'. Allowed formats: ${allowedExtensions.join(', ')}`, 400, 'VAL_INVALID_FILE_TYPE');
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (buffer.length > MAX_SIZE) {
      throw new AppError('Attachment exceeds maximum size of 10MB.', 400, 'VAL_FILE_TOO_LARGE');
    }

    // Magic Byte File Content Verification
    const isPng = buffer.length >= 8 &&
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
      buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a;
    const isJpeg = buffer.length >= 3 &&
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp = buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    const isPdf = buffer.length >= 5 &&
      buffer.subarray(0, 5).toString('ascii') === '%PDF-';

    if (ext === '.png' && !isPng) {
      throw new AppError('File content signature does not match declared PNG image format.', 400, 'VAL_INVALID_FILE_CONTENT');
    }
    if (['.jpg', '.jpeg'].includes(ext) && !isJpeg) {
      throw new AppError('File content signature does not match declared JPEG image format.', 400, 'VAL_INVALID_FILE_CONTENT');
    }
    if (ext === '.webp' && !isWebp) {
      throw new AppError('File content signature does not match declared WEBP image format.', 400, 'VAL_INVALID_FILE_CONTENT');
    }
    if (ext === '.pdf' && !isPdf) {
      throw new AppError('File content signature does not match declared PDF document format.', 400, 'VAL_INVALID_FILE_CONTENT');
    }

    const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    const stored = await storageService.storeAttachment({
      filename: safeName,
      buffer,
      targetSubdir: isEvidence ? 'evidence' : 'complaints'
    });

    const attachmentUuid = crypto.randomUUID();
    const attachmentDoc = new ComplaintAttachment({
      attachmentUuid,
      complaintId: complaint._id,
      complaintUuid: complaint.complaintUuid,
      fileName,
      fileType: fileType || `image/${ext.replace('.', '')}`,
      fileSize: buffer.length,
      storagePath: stored.url,
      uploadedByUuid: actorUser.userUuid
    });
    await attachmentDoc.save({ session });

    // Record in immutable event ledger
    const ledger = await this.recordLedgerEvent(
      complaint,
      'ATTACHMENT_UPLOADED',
      actorUser,
      complaint.status,
      complaint.status,
      `Uploaded file: ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`,
      { attachmentUuid, fileName, storageUrl: stored.url, isEvidence },
      session
    );

    // If marked as evidence and user is assigned technician or admin, also append to evidenceUrls
    if (isEvidence) {
      const isTech = complaint.technicianAssignment?.technicianUserUuid === actorUser.userUuid;
      const isAdmin = (actorUser.roles || []).some(r => ['ADMIN', 'SUPER_ADMIN', 'CAMPUS_SERVICES_HEAD'].includes(r));
      if (isTech || isAdmin) {
        await Complaint.updateOne(
          { complaintUuid },
          { $addToSet: { 'technicianAssignment.evidenceUrls': stored.url } },
          { session }
        );
      }
    }

    return {
      attachmentUuid,
      fileName,
      url: stored.url,
      fileSize: buffer.length,
      ledgerUuid: ledger.ledgerUuid
    };
  }
}

module.exports = new ComplaintAggregate();

const mongoose = require('mongoose');

const baseTenantFields = {
  tenantId: { type: String, required: true, index: true, default: 'tenant_campus_01' },
  campusId: { type: String, required: true, index: true, default: 'main_campus' },
  isDeleted: { type: Boolean, required: true, default: false, index: true },
  deletedAt: { type: Date, default: null }
};

// 1. Root Complaint Aggregate Schema (With Optimistic Concurrency Control)
const complaintSchema = new mongoose.Schema({
  ...baseTenantFields,
  version: { type: Number, required: true, default: 1 }, // Optimistic Concurrency Lock
  complaintUuid: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/, 'Invalid UUID v4 format']
  },
  complaintCode: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    match: [/^CMP-\d{4}-[A-Z0-9_]{2,16}-\d{6}$/, 'Invalid complaint code format (e.g. CMP-2026-IT-000123)']
  },
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
  description: { type: String, required: true, trim: true, minlength: 10 },
  categoryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  subcategoryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  domainType: { type: String, enum: ['ACADEMIC', 'OPERATIONAL'], default: 'ACADEMIC', index: true },
  departmentCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  divisionCode: { type: String, uppercase: true, trim: true, default: '2024-IT-A', index: true },
  priority: { 
    type: String, 
    required: true, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
    default: 'MEDIUM',
    index: true 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['DRAFT', 'SUBMITTED', 'CATEGORIZED', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED', 'REJECTED', 'RETURNED_FOR_CORRECTION'], 
    default: 'SUBMITTED',
    index: true 
  },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdByUserUuid: { type: String, required: true, index: true },
  createdByName: { type: String, required: true },
  assignedToUserUuid: { type: String, default: null, index: true },
  assignedToName: { type: String, default: null },
  assignedToRole: { type: String, default: null },
  currentAssignment: {
    handlerUserUuid: { type: String, default: null },
    handlerName: { type: String, default: null },
    handlerRole: { type: String, default: null },
    assignedAt: { type: Date, default: Date.now },
    slaHours: { type: Number, default: 24 }
  },
  assignmentHistory: [{
    handlerUserUuid: String,
    handlerName: String,
    handlerRole: String,
    assignedAt: Date,
    unassignedAt: Date,
    reason: String
  }],
  assignedUserUuids: [{ type: String, index: true }],
  forwardedFromUserUuid: { type: String, index: true, default: null },
  forwardedFromName: { type: String, default: null },
  resolvedByUserUuid: { type: String, index: true, default: null },
  resolvedByName: { type: String, default: null },
  location: {
    buildingCode: { type: String, uppercase: true, trim: true },
    roomCode: { type: String, uppercase: true, trim: true }
  },
  // Independent Technician Work Structure (Physical Repair Track)
  technicianAssignment: {
    technicianUserUuid: { type: String, default: null, index: true },
    technicianName: { type: String, default: null },
    trade: { type: String, default: null }, // ELECTRICIAN, PLUMBER, IT_HARDWARE, CARPENTER, HVAC, CIVIL, etc.
    status: { 
      type: String, 
      enum: ['UNASSIGNED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'], 
      default: 'UNASSIGNED', 
      index: true 
    },
    assignedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNotes: { type: String, default: '' },
    evidenceUrls: [{ type: String }]
  },
  // Administrative Rejection Metadata
  rejectionDetails: {
    rejectedByUserUuid: { type: String, default: null },
    rejectedByName: { type: String, default: null },
    rejectedByRole: { type: String, default: null },
    reason: { type: String, default: null },
    rejectedAt: { type: Date, default: null }
  },
  // Return for Student Correction Metadata
  correctionDetails: {
    returnedByUserUuid: { type: String, default: null },
    returnedByName: { type: String, default: null },
    returnedByRole: { type: String, default: null },
    instructions: { type: String, default: null },
    returnedAt: { type: Date, default: null }
  },
  // Policy-Driven Principal Approval
  policyApproval: {
    requiresPrincipalApproval: { type: Boolean, default: false, index: true },
    policyReason: { type: String, default: null }, // e.g. 'HIGH_BUDGET', 'STRUCTURAL_SAFETY', 'CAMPUS_POLICY'
    approvalStatus: { 
      type: String, 
      enum: ['NOT_REQUIRED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'], 
      default: 'NOT_REQUIRED',
      index: true 
    },
    decisionByUserUuid: { type: String, default: null },
    decisionByName: { type: String, default: null },
    decisionNotes: { type: String, default: null },
    decisionAt: { type: Date, default: null }
  },
  // Multi-Tiered SLA Timers
  slaTimers: {
    responseSlaDeadline: { type: Date, default: null },
    resolutionSlaDeadline: { type: Date, required: true, index: true },
    slaWarningThreshold: { type: Date, required: true },
    slaBreached: { type: Boolean, required: true, default: false, index: true }
  },
  resolvedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null }
}, { timestamps: true, collection: 'complaints' });

complaintSchema.index({ tenantId: 1, campusId: 1, status: 1 });
complaintSchema.index({ createdByUserUuid: 1, status: 1 });
complaintSchema.index({ assignedUserUuids: 1, status: 1 });
complaintSchema.index({ departmentCode: 1, status: 1 });
complaintSchema.index({ 'slaTimers.resolutionSlaDeadline': 1, status: 1 });
complaintSchema.index({ 'technicianAssignment.technicianUserUuid': 1, 'technicianAssignment.status': 1 });
complaintSchema.index({ 'policyApproval.requiresPrincipalApproval': 1, 'policyApproval.approvalStatus': 1 });

// 2. Complaint Event Ledger Schema (Immutable Audit & Timeline Ledger)
const complaintEventLedgerSchema = new mongoose.Schema({
  ledgerUuid: { type: String, required: true, unique: true, index: true },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, index: true },
  complaintUuid: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    required: true, 
    enum: [
      'COMPLAINT_DRAFT_SAVED', 'COMPLAINT_SUBMITTED', 'COMPLAINT_ASSIGNED', 
      'ASSIGNMENT_ACCEPTED', 'ASSIGNMENT_REJECTED', 'COMMENT_ADDED', 
      'ATTACHMENT_UPLOADED', 'STATUS_CHANGED', 'COMPLAINT_PRIORITY_CHANGED', 'COMPLAINT_FORWARDED', 'SLA_WARNING', 
      'SLA_BREACHED', 'COMPLAINT_ESCALATED', 'COMPLAINT_RESOLVED', 
      'COMPLAINT_CLOSED', 'COMPLAINT_REOPENED', 'COMPLAINT_CANCELLED',
      'COMPLAINT_REJECTED', 'COMPLAINT_RETURNED_FOR_CORRECTION',
      'TECHNICIAN_ASSIGNED', 'TECHNICIAN_STATUS_UPDATED', 'TECHNICIAN_COMPLETED',
      'PRINCIPAL_APPROVAL_REQUESTED', 'PRINCIPAL_APPROVED', 'PRINCIPAL_REJECTED'
    ],
    index: true 
  },
  actorUuid: { type: String, required: true },
  actorName: { type: String, required: true },
  previousState: { type: String, default: null },
  newState: { type: String, default: null },
  note: { type: String, trim: true, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, required: true, default: Date.now, index: true }
}, { timestamps: true, collection: 'complaintEventLedger' });

// 3. Typed Complaint Comment Schema (PUBLIC, INTERNAL, SYSTEM)
const complaintCommentSchema = new mongoose.Schema({
  commentUuid: { type: String, required: true, unique: true, index: true },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, index: true },
  complaintUuid: { type: String, required: true, index: true },
  authorUuid: { type: String, required: true },
  authorName: { type: String, required: true },
  commentType: { 
    type: String, 
    required: true, 
    enum: ['PUBLIC', 'INTERNAL', 'SYSTEM'], 
    default: 'PUBLIC',
    index: true 
  },
  message: { type: String, required: true, trim: true },
  timestamp: { type: Date, required: true, default: Date.now }
}, { timestamps: true, collection: 'complaintComments' });

// 4. Complaint Attachment Schema (Linked to Event Ledger)
const complaintAttachmentSchema = new mongoose.Schema({
  attachmentUuid: { type: String, required: true, unique: true, index: true },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, index: true },
  complaintUuid: { type: String, required: true, index: true },
  eventLedgerUuid: { type: String, default: null, index: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  storagePath: { type: String, required: true },
  uploadedByUuid: { type: String, required: true }
}, { timestamps: true, collection: 'complaintAttachments' });

// 5. Read-Model CQRS Complaint Snapshot Schema
const complaintSnapshotSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  complaintUuid: { type: String, required: true, unique: true, index: true },
  complaintCode: { type: String, required: true, index: true },
  title: String,
  description: String,
  categoryCode: String,
  departmentCode: String,
  divisionCode: String,
  priority: String,
  status: String,
  createdByUserUuid: String,
  createdByName: String,
  assignedToUserUuid: String,
  assignedToName: String,
  assignedUserUuids: [{ type: String, index: true }],
  forwardedFromUserUuid: { type: String, index: true, default: null },
  forwardedFromName: { type: String, default: null },
  resolvedByUserUuid: { type: String, index: true, default: null },
  resolvedByName: { type: String, default: null },
  // Technician read-model fields
  technicianStatus: { type: String, default: 'UNASSIGNED' },
  technicianName: { type: String, default: null },
  technicianTrade: { type: String, default: null },
  // Policy Approval read-model fields
  requiresPrincipalApproval: { type: Boolean, default: false },
  approvalStatus: { type: String, default: 'NOT_REQUIRED' },
  resolutionSlaDeadline: Date,
  slaBreached: Boolean,
  lastUpdated: { type: Date, default: Date.now, index: true }
}, { timestamps: true, collection: 'complaintSnapshots' });

module.exports = {
  ComplaintSchema: complaintSchema,
  ComplaintEventLedgerSchema: complaintEventLedgerSchema,
  ComplaintCommentSchema: complaintCommentSchema,
  ComplaintAttachmentSchema: complaintAttachmentSchema,
  ComplaintSnapshotSchema: complaintSnapshotSchema
};

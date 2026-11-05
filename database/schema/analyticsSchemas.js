const mongoose = require('mongoose');

const baseTenantFields = {
  tenantId: { type: String, required: true, index: true, default: 'tenant_campus_01' },
  campusId: { type: String, required: true, index: true, default: 'main_campus' }
};

// 1. Complaint Reporting Fact Schema
const reportingComplaintFactSchema = new mongoose.Schema({
  ...baseTenantFields,
  dateKey: { type: Number, required: true, index: true }, // YYYYMMDD e.g. 20260803
  complaintUuid: { type: String, required: true, unique: true, index: true },
  complaintCode: { type: String, required: true, index: true },
  userUuid: { type: String, required: true, index: true },
  departmentCode: { type: String, required: true, index: true },
  categoryCode: { type: String, required: true, index: true },
  priority: { type: String, required: true, index: true },
  status: { type: String, required: true, index: true },
  resolutionDurationHours: { type: Number, default: null },
  slaBreached: { type: Boolean, required: true, default: false, index: true }
}, { timestamps: true, collection: 'reportingComplaintFacts' });

reportingComplaintFactSchema.index({ tenantId: 1, departmentCode: 1, dateKey: -1 });

// 2. SLA Reporting Fact Schema
const reportingSlaFactSchema = new mongoose.Schema({
  ...baseTenantFields,
  dateKey: { type: Number, required: true, index: true },
  complaintUuid: { type: String, required: true, unique: true, index: true },
  departmentCode: { type: String, required: true, index: true },
  slaHours: { type: Number, required: true },
  actualResolutionHours: { type: Number, default: null },
  slaStatus: { type: String, required: true, enum: ['ON_TIME', 'BREACHED', 'PENDING'], default: 'PENDING', index: true }
}, { timestamps: true, collection: 'reportingSlaFacts' });

// 3. Faculty Workload & Assignment Fact Schema
const reportingAssignmentFactSchema = new mongoose.Schema({
  ...baseTenantFields,
  dateKey: { type: Number, required: true, index: true },
  complaintUuid: { type: String, required: true, index: true },
  assignedToUserUuid: { type: String, required: true, index: true },
  assignedToRole: { type: String, required: true, index: true },
  departmentCode: { type: String, required: true, index: true }
}, { timestamps: true, collection: 'reportingAssignmentFacts' });

// 4. Notification Delivery Fact Schema
const reportingNotificationFactSchema = new mongoose.Schema({
  ...baseTenantFields,
  dateKey: { type: Number, required: true, index: true },
  notificationUuid: { type: String, required: true, index: true },
  userUuid: { type: String, required: true, index: true },
  channel: { type: String, required: true, index: true },
  priority: { type: String, required: true, index: true },
  status: { type: String, required: true, index: true }
}, { timestamps: true, collection: 'reportingNotificationFacts' });

module.exports = {
  ReportingComplaintFactSchema: reportingComplaintFactSchema,
  ReportingSlaFactSchema: reportingSlaFactSchema,
  ReportingAssignmentFactSchema: reportingAssignmentFactSchema,
  ReportingNotificationFactSchema: reportingNotificationFactSchema
};

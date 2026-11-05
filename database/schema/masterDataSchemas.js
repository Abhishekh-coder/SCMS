const mongoose = require('mongoose');

// Base Master Data Audit, Multi-Tenancy & Versioning Fields
const baseMasterDataFields = {
  tenantId: { type: String, required: true, index: true, default: 'tenant_campus_01' },
  campusId: { type: String, required: true, index: true, default: 'main_campus' },
  version: { type: Number, required: true, default: 1 },
  effectiveFrom: { type: Date, required: true, default: Date.now },
  effectiveTo: { type: Date, default: null },
  isCurrent: { type: Boolean, required: true, default: true, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'], 
    default: 'ACTIVE',
    index: true 
  },
  createdBy: { type: String, default: 'SYSTEM' },
  updatedBy: { type: String, default: 'SYSTEM' }
};

// 1. Department Master Schema
const departmentMasterSchema = new mongoose.Schema({
  ...baseMasterDataFields,
  departmentCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  buildingCode: { type: String, uppercase: true, trim: true, default: null }
}, { timestamps: true, collection: 'masterDepartments' });

departmentMasterSchema.index({ tenantId: 1, departmentCode: 1, version: 1 }, { unique: true });

// 2. Building & Location Master Schema
const locationMasterSchema = new mongoose.Schema({
  ...baseMasterDataFields,
  buildingCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  buildingName: { type: String, required: true, trim: true },
  floorNumber: { type: Number, required: true, default: 0 },
  roomCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  roomType: { type: String, enum: ['CLASSROOM', 'LAB', 'OFFICE', 'AUDITORIUM', 'HOSTEL'], default: 'CLASSROOM' },
  capacity: { type: Number, default: 60 }
}, { timestamps: true, collection: 'masterLocations' });

locationMasterSchema.index({ tenantId: 1, buildingCode: 1, roomCode: 1, version: 1 }, { unique: true });

// 3. Academic Program & Course Master Schema
const academicMasterSchema = new mongoose.Schema({
  ...baseMasterDataFields,
  programCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  programName: { type: String, required: true, trim: true },
  departmentCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  degree: { type: String, enum: ['B.TECH', 'M.TECH', 'B.SC', 'M.SC', 'PHD', 'DIPLOMA'], default: 'B.TECH' },
  durationYears: { type: Number, required: true, default: 4 },
  totalSemesters: { type: Number, required: true, default: 8 }
}, { timestamps: true, collection: 'masterAcademics' });

academicMasterSchema.index({ tenantId: 1, programCode: 1, version: 1 }, { unique: true });

// 4. Generic Relationship Engine Schema (Relationship Collection)
const relationshipSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true, default: 'tenant_campus_01' },
  campusId: { type: String, required: true, index: true, default: 'main_campus' },
  sourceType: { 
    type: String, 
    required: true, 
    enum: ['DEPARTMENT', 'DIVISION', 'STUDENT', 'FACULTY', 'COURSE', 'BUILDING'],
    index: true 
  },
  sourceId: { type: String, required: true, index: true }, // e.g. "CSE" or student userUuid
  relationshipType: { 
    type: String, 
    required: true, 
    enum: ['HAS_HOD', 'HAS_CLASS_INCHARGE', 'HAS_TEACHER_GUARDIAN', 'HAS_DEAN', 'LOCATED_IN', 'BELONGS_TO'],
    index: true 
  },
  targetType: { 
    type: String, 
    required: true, 
    enum: ['FACULTY', 'DEPARTMENT', 'BUILDING', 'ROOM'],
    index: true 
  },
  targetId: { type: String, required: true, index: true }, // e.g. faculty userUuid or employeeId
  effectiveFrom: { type: Date, required: true, default: Date.now },
  effectiveTo: { type: Date, default: null },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true }
}, { timestamps: true, collection: 'masterRelationships' });

relationshipSchema.index({ tenantId: 1, sourceType: 1, sourceId: 1, relationshipType: 1, status: 1 });

// 5. Complaint Metadata Schema (Categories, SLA, Priority)
const complaintMetadataSchema = new mongoose.Schema({
  ...baseMasterDataFields,
  categoryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  categoryName: { type: String, required: true, trim: true },
  subcategoryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  subcategoryName: { type: String, required: true, trim: true },
  defaultPriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  slaHours: { type: Number, required: true, default: 48 },
  escalationRoleCode: { type: String, default: 'HOD' },
  autoAssignmentRule: {
    targetType: { type: String, enum: ['DEPARTMENT_HOD', 'CLASS_INCHARGE', 'WARDEN', 'SPECIFIC_USER'], default: 'DEPARTMENT_HOD' },
    targetDepartmentCode: String
  }
}, { timestamps: true, collection: 'masterComplaintMetadata' });

complaintMetadataSchema.index({ tenantId: 1, categoryCode: 1, subcategoryCode: 1, version: 1 }, { unique: true });

// 6. Workflow Rule-Based Condition Config Schema
const workflowConfigSchema = new mongoose.Schema({
  ...baseMasterDataFields,
  workflowCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  applicableCategoryCode: { type: String, required: true, uppercase: true, index: true },
  initialState: { type: String, default: 'SUBMITTED' },
  rules: [{
    condition: {
      priorityEquals: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      escalatedFromHours: Number
    },
    targetState: String,
    autoAssignToRole: String,
    skipStep: Boolean
  }]
}, { timestamps: true, collection: 'masterWorkflowConfigs' });

module.exports = {
  DepartmentMasterSchema: departmentMasterSchema,
  LocationMasterSchema: locationMasterSchema,
  AcademicMasterSchema: academicMasterSchema,
  RelationshipSchema: relationshipSchema,
  ComplaintMetadataSchema: complaintMetadataSchema,
  WorkflowConfigSchema: workflowConfigSchema
};

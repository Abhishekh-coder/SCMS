/**
 * CCMS — Core Identity & Authorization Schemas (v2)
 *
 * Approved Architecture:
 *   - User = identity only. No department, no batch, no responsibility inside.
 *   - Profiles = domain data (StudentProfile, FacultyProfile, AdminProfile)
 *   - Roles = authorization boundary (STUDENT, FACULTY, HOD, DEAN, PRINCIPAL, ADMIN, SUPER_ADMIN)
 *   - OrganizationalAssignment = who handles what scope (CLASS_INCHARGE, TEACHER_GUARDIAN, etc.)
 *
 * Login ID Conventions (all unique per tenant):
 *   Student   : <batch>-<dept>-<division>-<roll>-STD
 *   Faculty   : EMP-<dept>-<number>
 *   Principal : EMP-0001           (no dept segment)
 *   Admin     : ADM-0001
 *   SuperAdmin: SYS-0001
 */

const mongoose = require('mongoose');
const { ROLES, ASSIGNMENT_TYPES, SCOPE_TYPES, PROFILE_TYPE } = require('../../backend/src/shared/constants/roles');

// ─── Shared base fields (multi-tenancy + soft-delete) ────────────────────────
const baseTenantFields = {
  tenantId:  { type: String, required: true, index: true, default: 'tenant_campus_01' },
  campusId:  { type: String, required: true, index: true, default: 'main_campus' },
  isDeleted: { type: Boolean, required: true, default: false, index: true },
  deletedAt: { type: Date, default: null },
};

// ─── 1. User — Root Identity ─────────────────────────────────────────────────
// Single account per person. loginId is the canonical credential.
// profileType + profileId point to the domain-specific profile document.
const userSchema = new mongoose.Schema({
  ...baseTenantFields,

  userUuid: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => crypto.randomUUID()
  },
  userCode: {
    type: String,
    trim: true,
    index: true,
  },
  fullName: {
    type: String,
    trim: true
  },

  // Canonical login credential (unique, system-generated)
  // loginId format varies by profile type (Student / Faculty / Admin)
  loginId: {
    type:     String,
    required: true,
    unique:   true,
    uppercase: true,
    trim:     true,
    index:    true,
  },

  // Institutional email (optional — not used as login ID)
  email: {
    type:      String,
    unique:    true,
    sparse:    true,   // allow null for students without email yet
    lowercase: true,
    trim:      true,
    index:     true,
    match:     [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format'],
  },

  phone: {
    type:  String,
    trim:  true,
    match: [/^\+?[0-9]{7,15}$/, 'Invalid phone number format'],
  },

  passwordHash: { type: String, required: true },

  accountStatus: {
    type:    String,
    required: true,
    enum:    ['REGISTERED', 'PENDING_ACTIVATION', 'PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'LOCKED', 'DISABLED', 'ARCHIVED', 'DELETED'],
    default: 'PENDING_VERIFICATION',
    index:   true,
  },

  // Which profile document this identity maps to
  profileType: {
    type:     String,
    required: true,
    enum:     Object.values(PROFILE_TYPE),
    index:    true,
  },
  profileId: {
    type:  mongoose.Schema.Types.ObjectId,
    index: true,
    // ref is dynamic based on profileType — resolved in application layer
  },

  // Authorization roles — assigned and managed via UserRole mapping
  // Denormalized here for fast JWT generation (source of truth is userRoles collection)
  roles: [{
    type: String,
    enum: Object.values(ROLES),
  }],

  // Security fields
  securityVersion: { type: Number, required: true, default: 1 },
  passwordHistory: [{
    passwordHash: { type: String, required: true },
    changedAt:    { type: Date, default: Date.now },
    changedBy:    { type: String },
    reason: {
      type:    String,
      enum:    ['USER_CHANGE', 'PASSWORD_RESET', 'ADMIN_RESET', 'FIRST_LOGIN'],
      default: 'USER_CHANGE',
    },
  }],
  failedLoginCount:   { type: Number, required: true, default: 0, min: 0, max: 10 },
  emailVerified:      { type: Boolean, required: true, default: false },
  phoneVerified:      { type: Boolean, required: true, default: false },
  twoFactorEnabled:   { type: Boolean, required: true, default: false },
  lastLogin:          { type: Date, default: null },
  passwordChangedAt:  { type: Date, default: null },
  activationToken:    { type: String, default: null },  // ERP-sourced pre-activation
  activatedAt:        { type: Date, default: null },

}, { timestamps: true, collection: 'users' });

// ─── User Aggregate Methods (Invariants) ──────────────────────────────────────
userSchema.methods.activate = function() {
  this.accountStatus = 'ACTIVE';
  this.emailVerified = true;
  this.activatedAt = new Date();
  this.failedLoginCount = 0;
  this.securityVersion = (this.securityVersion || 1) + 1;
};

userSchema.methods.changeEmail = function(newEmail) {
  this.email = newEmail.toLowerCase().trim();
  this.emailVerified = false;
  this.accountStatus = 'PENDING_VERIFICATION';
  this.securityVersion = (this.securityVersion || 1) + 1;
};

userSchema.methods.incrementSecurityVersion = function() {
  this.securityVersion = (this.securityVersion || 1) + 1;
};

userSchema.methods.lock = function() {
  this.accountStatus = 'LOCKED';
  this.securityVersion = (this.securityVersion || 1) + 1;
};

userSchema.methods.unlock = function() {
  this.accountStatus = 'ACTIVE';
  this.failedLoginCount = 0;
};

userSchema.index({ tenantId: 1, campusId: 1, accountStatus: 1 });
userSchema.index({ tenantId: 1, profileType: 1, isDeleted: 1 });
userSchema.index({ loginId: 1, tenantId: 1 }, { unique: true });

// ─── 2. StudentProfile ───────────────────────────────────────────────────────
// All student domain data. loginId derived: {batch}-{dept}-{division}-{roll}-STD
const studentProfileSchema = new mongoose.Schema({
  ...baseTenantFields,
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  loginId:   { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },

  // Parsed components of the loginId (for fast queries)
  admissionBatch: { type: Number, required: true, index: true },  // 2024
  department:     { type: String, required: true, uppercase: true, trim: true, index: true },  // IT
  division:       { type: String, required: true, uppercase: true, trim: true, index: true },  // A
  rollNo:         { type: String, required: true, uppercase: true, trim: true },                // 059
  rollNumber:     { type: String, uppercase: true, trim: true },
  branch:         { type: String, uppercase: true, trim: true },

  fullName:  { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  semester:  { type: Number, required: true, min: 1, max: 10 },

  // Academic year reference (FK to AcademicYear collection)
  currentAcademicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', index: true },

  // Hostel (optional)
  hostelBlock: { type: String, uppercase: true, trim: true, default: null },
  roomNumber:  { type: String, uppercase: true, trim: true, default: null },

  // Guardian info (stored in profile, NOT in User)
  guardianName:    { type: String, trim: true, default: null },
  guardianContact: { type: String, trim: true, default: null },

}, { timestamps: true, collection: 'studentProfiles' });

studentProfileSchema.index({ tenantId: 1, department: 1, division: 1, admissionBatch: 1 });
studentProfileSchema.index({ tenantId: 1, semester: 1, department: 1 });

// ─── 3. FacultyProfile ───────────────────────────────────────────────────────
// Domain data for all faculty. Responsibilities live in OrganizationalAssignment.
// loginId format: EMP-{DEPT}-{NUMBER}
const facultyProfileSchema = new mongoose.Schema({
  ...baseTenantFields,
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  loginId:   { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },

  // Parsed from loginId
  employeeCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  employeeId:   { type: String, uppercase: true, trim: true, index: true },
  department:   { type: String, required: true, uppercase: true, trim: true, index: true },
  departmentId: { type: String, uppercase: true, trim: true },

  fullName:    { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  designation: {
    type:     String,
    required: true,
    enum:     ['ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'PROFESSOR', 'LAB_ASSISTANT', 'LIBRARIAN', 'ADMIN_STAFF'],
  },
  joiningDate: { type: Date, default: null },
  qualification: { type: String, trim: true, default: null },

  isClassIncharge:   { type: Boolean, default: false },
  isTeacherGuardian: { type: Boolean, default: false },
  isHod:             { type: Boolean, default: false },
  isDean:            { type: Boolean, default: false },

  // ⚠️ NO isClassIncharge, isTeacherGuardian, isHod, isDean flags here.
  // Those live in OrganizationalAssignment. Faculty responsibilities change — identity doesn't.

}, { timestamps: true, collection: 'facultyProfiles' });

facultyProfileSchema.index({ tenantId: 1, department: 1 });

// ─── 4. AdminProfile ─────────────────────────────────────────────────────────
// loginId format: ADM-{NUMBER} | SYS-{NUMBER} | EMP-{NUMBER} (Principal)
const adminProfileSchema = new mongoose.Schema({
  ...baseTenantFields,
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  loginId:  { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  office:   { type: String, trim: true, default: null },
  designation: { type: String, trim: true, default: null },

}, { timestamps: true, collection: 'adminProfiles' });

// ─── 5. OrganizationalAssignment ─────────────────────────────────────────────
// Single source of truth for ALL operational responsibilities.
// Complaint routing reads this. Notification dispatch reads this. Analytics reads this.
//
// "Who is the Class Incharge for 2024-IT-A this academic year?"
// → SELECT * FROM orgAssignments WHERE assignmentType=CLASS_INCHARGE
//                                  AND scopeType=DIVISION AND scopeId="2024-IT-A"
//                                  AND isActive=true
//
// No if(category=="Hostel") anywhere. Ever.
const organizationalAssignmentSchema = new mongoose.Schema({
  ...baseTenantFields,

  assignmentType: {
    type:     String,
    required: true,
    enum:     Object.values(ASSIGNMENT_TYPES),
    index:    true,
  },

  // The faculty/admin assigned to this responsibility
  assigneeUserId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },
  assigneeLoginId: { type: String, required: true, uppercase: true, trim: true, index: true },

  // What scope this assignment covers
  scopeType: {
    type:     String,
    required: true,
    enum:     Object.values(SCOPE_TYPES),
    index:    true,
  },
  scopeId: {
    // e.g. "2024-IT-A" (division), "IT" (department), "BOYS-BLOCK-A" (hostel), "SW-LAB-2" (lab)
    type:     String,
    required: true,
    uppercase: true,
    trim:     true,
    index:    true,
  },
  scopeLabel: { type: String, trim: true, default: null }, // Human-readable

  // Academic year this assignment is valid for (null = permanent, e.g. Warden)
  academicYearId: {
    type:  mongoose.Schema.Types.ObjectId,
    ref:   'AcademicYear',
    index: true,
    default: null,
  },
  academicYearLabel: { type: String, trim: true, default: null }, // e.g. "2024-25"

  effectiveFrom: { type: Date, required: true, index: true },
  effectiveTo:   { type: Date, default: null },  // null = no expiry

  isPrimary: { type: Boolean, required: true, default: true },  // primary vs backup
  isActive:  { type: Boolean, required: true, default: true, index: true },

  // Who created this assignment and when
  assignedBy: {
    type:  mongoose.Schema.Types.ObjectId,
    ref:   'User',
    required: true,
  },
  assignedByLoginId: { type: String, uppercase: true, trim: true },
  assignedAt:        { type: Date, required: true, default: Date.now },

  // Audit trail
  notes: { type: String, trim: true, maxlength: 500, default: null },

}, { timestamps: true, collection: 'organizationalAssignments' });

// Critical compound indexes for complaint routing queries
organizationalAssignmentSchema.index({ tenantId: 1, assignmentType: 1, scopeType: 1, scopeId: 1, isActive: 1 });
organizationalAssignmentSchema.index({ tenantId: 1, assigneeUserId: 1, isActive: 1 });
organizationalAssignmentSchema.index({ tenantId: 1, academicYearId: 1, isActive: 1 });
organizationalAssignmentSchema.index({ effectiveTo: 1 }, { sparse: true });

// ─── 6. AcademicYear ─────────────────────────────────────────────────────────
// Used by OrganizationalAssignment and StudentProfile
const academicYearSchema = new mongoose.Schema({
  ...baseTenantFields,
  label:     { type: String, required: true, trim: true, index: true }, // "2024-25"
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },
  isCurrent: { type: Boolean, required: true, default: false, index: true },
}, { timestamps: true, collection: 'academicYears' });

academicYearSchema.index({ tenantId: 1, isCurrent: 1 });

// ─── 7. Department (Master Data) ─────────────────────────────────────────────
const departmentSchema = new mongoose.Schema({
  ...baseTenantFields,
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true, index: true }, // IT, CSE, ME
  name:        { type: String, required: true, trim: true },
  shortName:   { type: String, trim: true },
  hodUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  isActive:    { type: Boolean, required: true, default: true, index: true },
}, { timestamps: true, collection: 'departments' });

// ─── 8. Division (Master Data) ───────────────────────────────────────────────
// Represents a batch-department-division combination: 2024-IT-A
const divisionSchema = new mongoose.Schema({
  ...baseTenantFields,
  scopeId:     { type: String, required: true, unique: true, uppercase: true, trim: true, index: true }, // 2024-IT-A
  batch:       { type: Number, required: true, index: true },
  department:  { type: String, required: true, uppercase: true, trim: true, index: true },
  division:    { type: String, required: true, uppercase: true, trim: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', index: true },
  strength:    { type: Number, default: 0 },
  isActive:    { type: Boolean, required: true, default: true },
}, { timestamps: true, collection: 'divisions' });

divisionSchema.index({ tenantId: 1, department: 1, batch: 1 });

// ─── 9. Role & Permission Schemas ───────────────────────────────────────────
const permissionSchema = new mongoose.Schema({
  code: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
    match:    [/^[a-z0-9_]+:[a-z0-9_]+$/, 'Invalid permission code format'],
    index:    true,
  },
  module: {
    type:     String,
    required: true,
    enum:     ['complaints', 'analytics', 'users', 'auth', 'workflow'],
    index:    true,
  },
  description: { type: String, trim: true, default: '' },
}, { timestamps: true, collection: 'permissions' });

const roleSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true,
  },
  code: {
    type:      String,
    required:  true,
    unique:    true,
    uppercase: true,
    trim:      true,
    match:     [/^[A-Z0-9_]+$/, 'Invalid role code format'],
    index:     true,
  },
  description: { type: String, trim: true, default: '' },
  permissions: [{ type: String }],
}, { timestamps: true, collection: 'roles' });

// ─── 10. UserRole Mapping ───────────────────────────────────────────────────
// Authoritative role assignments — userSchema.roles[] is a denormalized cache
const userRoleSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  roleId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Role', index: true },
  role:        { type: String, enum: Object.values(ROLES), index: true },
  assignedBy:  { type: String, required: true, default: 'SYSTEM' },
  assignedAt:  { type: Date, required: true, default: Date.now },
  expiresAt:   { type: Date, default: null },
  revokedAt:   { type: Date, default: null },
  isActive:    { type: Boolean, required: true, default: true, index: true },
}, { timestamps: true, collection: 'userRoles' });

userRoleSchema.index({ userId: 1, role: 1 }, { sparse: true });
userRoleSchema.index({ userId: 1, isActive: 1 });

// ─── 10. Session ─────────────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema({
  sessionUuid:       { type: String, required: true, unique: true, index: true },
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loginId:           { type: String, index: true },
  deviceName:        { type: String, default: null },
  browser:           { type: String, default: null },
  browserVersion:    { type: String, default: null },
  OS:                { type: String, default: null },
  ipAddress:         { type: String, default: null },
  country:           { type: String, default: null },
  city:              { type: String, default: null },
  trustedDevice:     { type: Boolean, default: false },
  deviceFingerprint: { type: String, default: null },
  lastSeen:          { type: Date, default: Date.now },
  revokedAt:         { type: Date, default: null },
}, { timestamps: true, collection: 'sessions' });

// ─── 11. Refresh Token ───────────────────────────────────────────────────────
const refreshTokenSchema = new mongoose.Schema({
  familyId:    { type: String, required: true, index: true },
  generation:  { type: Number, required: true, default: 1 },
  token:       { type: String, required: true, unique: true },
  parentToken: { type: String, default: null },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loginId:     { type: String, index: true },
  sessionId:   { type: String, required: true },
  rotatedAt:   { type: Date, default: null },
  revokedAt:   { type: Date, default: null },
}, { timestamps: true, collection: 'refreshTokens' });

// ─── 12. OTP ─────────────────────────────────────────────────────────────────
const otpSchema = new mongoose.Schema({
  otpUuid:  { type: String, required: true, unique: true, index: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loginId:  { type: String, index: true },
  purpose:  { type: String, enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION', 'ACTIVATION'], required: true, index: true },
  channel:  { type: String, enum: ['EMAIL', 'SMS', 'WHATSAPP'], default: 'EMAIL' },
  codeHash: { type: String, required: true },
  email:    { type: String, index: true, lowercase: true, trim: true },
  phone:    { type: String, trim: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts:  { type: Number, required: true, default: 0 },
  maxAttempts: { type: Number, required: true, default: 3 },
  status:   { type: String, required: true, enum: ['PENDING', 'VERIFIED', 'EXPIRED', 'FAILED'], default: 'PENDING', index: true },
  consumedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'otps' });

// ─── 13. Audit Log ───────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  eventType:  { type: String, required: true, index: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  loginId:    { type: String, default: null, index: true },
  ipAddress:  { type: String, default: null },
  userAgent:  { type: String, default: null },
  details:    { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp:  { type: Date, default: Date.now, index: true },
}, { timestamps: true, collection: 'auditLogs' });

// ─── 14. Power BI Login Fact ─────────────────────────────────────────────────
const reportingLoginFactSchema = new mongoose.Schema({
  dateKey:      { type: Number, required: true, index: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loginId:      { type: String, required: true },
  roles:        [{ type: String }],
  department:   { type: String, default: null, index: true },
  loginSuccess: { type: Boolean, required: true },
  deviceType:   { type: String, default: 'DESKTOP' },
  browser:      { type: String, default: 'UNKNOWN' },
  ipAddress:    { type: String, default: null },
  country:      { type: String, default: null },
}, { timestamps: true, collection: 'reportingLoginFacts' });

module.exports = {
  UserSchema:                    userSchema,
  RoleSchema:                    roleSchema,
  PermissionSchema:              permissionSchema,
  StudentProfileSchema:          studentProfileSchema,
  FacultyProfileSchema:          facultyProfileSchema,
  AdminProfileSchema:            adminProfileSchema,
  OrganizationalAssignmentSchema: organizationalAssignmentSchema,
  AcademicYearSchema:            academicYearSchema,
  DepartmentSchema:              departmentSchema,
  DivisionSchema:                divisionSchema,
  UserRoleSchema:                userRoleSchema,
  SessionSchema:                 sessionSchema,
  RefreshTokenSchema:            refreshTokenSchema,
  OtpSchema:                     otpSchema,
  AuditLogSchema:                auditLogSchema,
  ReportingLoginFactSchema:      reportingLoginFactSchema,
};

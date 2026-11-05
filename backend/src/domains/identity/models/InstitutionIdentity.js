/**
 * CCMS — Institution Identity Aggregate Model
 *
 * Sourced from ERP import / pre-staged master data.
 * IdentityOrchestrator links a new User account to an existing InstitutionIdentity during registration.
 */

const mongoose = require('mongoose');

const baseTenantFields = {
  tenantId:  { type: String, required: true, index: true, default: 'tenant_campus_01' },
  campusId:  { type: String, required: true, index: true, default: 'main_campus' },
  isDeleted: { type: Boolean, required: true, default: false, index: true },
  deletedAt: { type: Date, default: null },
};

const institutionIdentitySchema = new mongoose.Schema({
  ...baseTenantFields,

  loginId: {
    type:      String,
    required:  true,
    unique:    true,
    uppercase: true,
    trim:      true,
    index:     true,
  },
  fullName: {
    type:     String,
    required: true,
    trim:     true,
  },
  email: {
    type:      String,
    lowercase: true,
    trim:      true,
    index:     true,
  },
  identityType: {
    type:     String,
    required: true,
    enum:     ['STUDENT', 'FACULTY', 'ADMIN', 'EMPLOYEE'],
    index:    true,
  },
  department: {
    type:      String,
    uppercase: true,
    trim:      true,
    default:   'GENERAL',
  },
  status: {
    type:     String,
    required: true,
    enum:     ['UNLINKED', 'PENDING_ACTIVATION', 'ACTIVE', 'ARCHIVED'],
    default:  'UNLINKED',
    index:    true,
  },

  // Linked User account reference
  linkedUserUuid: {
    type:    String,
    default: null,
    index:   true,
  },
  linkedUserId: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'User',
    default: null,
  },
  linkedAt: {
    type:    Date,
    default: null,
  },
}, { timestamps: true, collection: 'institutionIdentities' });

institutionIdentitySchema.index({ tenantId: 1, campusId: 1, loginId: 1 }, { unique: true });
institutionIdentitySchema.index({ tenantId: 1, campusId: 1, identityType: 1, status: 1 });

const InstitutionIdentity = mongoose.models.InstitutionIdentity || mongoose.model('InstitutionIdentity', institutionIdentitySchema);

module.exports = {
  InstitutionIdentitySchema: institutionIdentitySchema,
  InstitutionIdentity,
};

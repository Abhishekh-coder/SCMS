const mongoose = require('mongoose');

const baseTenantFields = {
  tenantId: { type: String, required: true, index: true, default: 'tenant_campus_01' },
  campusId: { type: String, required: true, index: true, default: 'main_campus' }
};

// 1. AI Recommendation Schema (Enclosing Confidence & Human Approval)
const aiRecommendationSchema = new mongoose.Schema({
  ...baseTenantFields,
  recommendationUuid: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/, 'Invalid UUID v4 format']
  },
  complaintUuid: { type: String, default: null, index: true },
  recommendationType: { 
    type: String, 
    required: true, 
    enum: ['TRIAGE', 'DUPLICATE_DETECTION', 'SUMMARIZATION', 'FACULTY_ASSIGNMENT', 'SUGGESTED_RESPONSE', 'SMART_SEARCH'],
    index: true 
  },
  suggestedValue: { type: mongoose.Schema.Types.Mixed, required: true },
  confidenceScore: { type: Number, required: true, min: 0.0, max: 1.0 },
  reasoningSummary: { type: String, required: true },
  sourceData: [{ type: String }],
  humanApprovalStatus: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING',
    index: true 
  },
  actionedByUuid: { type: String, default: null },
  actionedAt: { type: Date, default: null }
}, { timestamps: true, collection: 'aiRecommendations' });

aiRecommendationSchema.index({ tenantId: 1, humanApprovalStatus: 1 });

// 2. Versioned Prompt Template Schema
const promptTemplateSchema = new mongoose.Schema({
  promptCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  version: { type: Number, required: true, default: 1 },
  isCurrent: { type: Boolean, required: true, default: true, index: true },
  promptText: { type: String, required: true },
  outputSchema: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, collection: 'promptTemplates' });

promptTemplateSchema.index({ promptCode: 1, version: 1 }, { unique: true });

// 3. AI Governance Audit Log Schema
const aiAuditLogSchema = new mongoose.Schema({
  auditUuid: { type: String, required: true, unique: true, index: true },
  recommendationUuid: { type: String, default: null, index: true },
  promptCode: { type: String, required: true },
  promptVersion: { type: Number, required: true, default: 1 },
  modelVersion: { type: String, required: true, default: 'gemini-1.5-pro' },
  confidenceScore: { type: Number, required: true },
  humanDecision: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  latencyMs: { type: Number, default: 0 },
  feedback: { type: String, default: null }
}, { timestamps: true, collection: 'aiAuditLogs' });

module.exports = {
  AiRecommendationSchema: aiRecommendationSchema,
  PromptTemplateSchema: promptTemplateSchema,
  AiAuditLogSchema: aiAuditLogSchema
};

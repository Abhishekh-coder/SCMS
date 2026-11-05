const crypto = require('crypto');
const mongoose = require('mongoose');
const geminiProvider = require('../../../infrastructure/ai/GeminiProvider');
const promptLibrary = require('./PromptLibrary');
const {
  AiRecommendationSchema,
  AiAuditLogSchema
} = require('../../../../../database/schema/aiSchemas');
const { AppError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../config/logger');

const AiRecommendation = mongoose.models.AiRecommendation || mongoose.model('AiRecommendation', AiRecommendationSchema);
const AiAuditLog = mongoose.models.AiAuditLog || mongoose.model('AiAuditLog', AiAuditLogSchema);

class AiTriageService {
  async triageComplaint(complaintData) {
    const startTime = Date.now();
    const { title, description, complaintUuid } = complaintData;

    // 1. Compile Versioned Prompt from Prompt Library
    const { promptText, version } = promptLibrary.compilePrompt('COMPLAINT_TRIAGE', { title, description });

    // 2. Generate Completion via Gemini Model Provider Adapter
    const aiResult = await geminiProvider.generateCompletion(promptText);
    const latencyMs = Date.now() - startTime;

    const recommendationUuid = crypto.randomUUID();

    // 3. Build Recommendation Document (Status: PENDING)
    const recDoc = new AiRecommendation({
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus',
      recommendationUuid,
      complaintUuid: complaintUuid || null,
      recommendationType: 'TRIAGE',
      suggestedValue: aiResult.suggestedValue,
      confidenceScore: aiResult.confidenceScore,
      reasoningSummary: aiResult.reasoningSummary,
      sourceData: [complaintUuid || 'NEW_SUBMISSION'],
      humanApprovalStatus: 'PENDING'
    });

    const savedRec = await recDoc.save();

    // 4. Log AI Governance Audit Record
    const auditDoc = new AiAuditLog({
      auditUuid: crypto.randomUUID(),
      recommendationUuid,
      promptCode: 'COMPLAINT_TRIAGE',
      promptVersion: version,
      modelVersion: aiResult.modelVersion || 'gemini-1.5-pro',
      confidenceScore: aiResult.confidenceScore,
      humanDecision: 'PENDING',
      latencyMs
    });
    await auditDoc.save();

    logger.info(`🤖 [AiTriageService] Generated Triage Recommendation (${aiResult.confidenceScore * 100}% confidence)`);
    return savedRec;
  }

  async detectDuplicates(newTitle, newDescription, openComplaints = []) {
    const newText = `${newTitle} ${newDescription}`.toLowerCase();
    const matches = [];

    for (const cmp of openComplaints) {
      const cmpText = `${cmp.title} ${cmp.description}`.toLowerCase();
      // Calculate token overlap Jaccard similarity score
      const setA = new Set(newText.split(/\s+/));
      const setB = new Set(cmpText.split(/\s+/));
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      const similarityScore = parseFloat((intersection.size / union.size).toFixed(2));

      if (similarityScore >= 0.3) {
        matches.push({
          complaintUuid: cmp.complaintUuid,
          complaintCode: cmp.complaintCode,
          title: cmp.title,
          similarityScore
        });
      }
    }

    return matches.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  async actionRecommendation(recommendationUuid, actorUser, decision) {
    const upperDecision = decision.toUpperCase().trim();
    if (!['APPROVED', 'REJECTED'].includes(upperDecision)) {
      throw new AppError("Decision must be 'APPROVED' or 'REJECTED'.", 400, 'VAL_001');
    }

    const rec = await AiRecommendation.findOne({ recommendationUuid });
    if (!rec) {
      throw new AppError(`AI Recommendation '${recommendationUuid}' not found.`, 404, 'NOT_FOUND');
    }

    rec.humanApprovalStatus = upperDecision;
    rec.actionedByUuid = actorUser.userUuid;
    rec.actionedAt = new Date();
    const updated = await rec.save();

    // Update Governance Audit Log
    await AiAuditLog.updateOne(
      { recommendationUuid },
      { $set: { humanDecision: upperDecision } }
    );

    logger.info(`👤 [HITL Workflow] Human '${actorUser.fullName}' ${upperDecision} AI Recommendation '${recommendationUuid}'`);
    return updated;
  }
}

module.exports = new AiTriageService();

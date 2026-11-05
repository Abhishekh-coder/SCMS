const { describe, it } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');

const promptLibrary = require('../../backend/src/domains/ai/services/PromptLibrary');
const geminiProvider = require('../../backend/src/infrastructure/ai/GeminiProvider');
const aiTriageService = require('../../backend/src/domains/ai/services/AiTriageService');
const {
  AiRecommendationSchema,
  PromptTemplateSchema,
  AiAuditLogSchema
} = require('../../database/schema/aiSchemas');

describe('Phase 6 - AI Intelligence Platform Unit Tests', () => {
  const AiRecommendation = mongoose.models.TestAiRecommendation || mongoose.model('TestAiRecommendation', AiRecommendationSchema);
  const PromptTemplate = mongoose.models.TestPromptTemplate || mongoose.model('TestPromptTemplate', PromptTemplateSchema);
  const AiAuditLog = mongoose.models.TestAiAuditLog || mongoose.model('TestAiAuditLog', AiAuditLogSchema);

  it('1. should validate PromptLibrary prompt compilation and versioning', () => {
    const compiled = promptLibrary.compilePrompt('COMPLAINT_TRIAGE', {
      title: 'Wi-Fi Not Working',
      description: 'Hostel Block B room 302 Wi-Fi down'
    });

    assert.ok(compiled);
    assert.strictEqual(compiled.version, 1);
    assert.ok(compiled.promptText.includes('Wi-Fi Not Working'));
  });

  it('2. should validate AiRecommendationSchema confidence score and HITL approval states', () => {
    const rec = new AiRecommendation({
      recommendationUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      recommendationType: 'TRIAGE',
      suggestedValue: { categoryCode: 'INFRASTRUCTURE' },
      confidenceScore: 0.94,
      reasoningSummary: 'Keyword matched Wi-Fi infrastructure',
      humanApprovalStatus: 'PENDING'
    });

    assert.strictEqual(rec.validateSync(), undefined);
    assert.strictEqual(rec.confidenceScore, 0.94);
    assert.strictEqual(rec.humanApprovalStatus, 'PENDING');
  });

  it('3. should generate structured completion via GeminiProvider adapter', async () => {
    const res = await geminiProvider.generateCompletion('Test Prompt');
    assert.ok(res);
    assert.strictEqual(res.modelVersion, 'gemini-1.5-pro');
    assert.strictEqual(typeof res.confidenceScore, 'number');
    assert.ok(res.reasoningSummary);
  });

  it('4. should calculate duplicate complaint token similarity using AiTriageService', async () => {
    const matches = await aiTriageService.detectDuplicates(
      'Wi-Fi Not Working in Hostel Block B',
      'Internet connection drops repeatedly in room 302',
      [
        {
          complaintUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          complaintCode: 'CMP-2026-IT-100201',
          title: 'Wi-Fi Connection Issues in Hostel Block B',
          description: 'Internet connection is completely down'
        }
      ]
    );

    assert.ok(Array.isArray(matches));
    assert.strictEqual(matches.length, 1);
    assert.ok(matches[0].similarityScore >= 0.3);
  });
});

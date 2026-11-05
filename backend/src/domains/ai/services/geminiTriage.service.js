const { logger } = require('../../../config/logger');

class GeminiTriageService {
  async analyze(description, context = {}) {
    const startTime = Date.now();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API 3000ms timeout exceeded')), 3000)
    );

    const aiPromise = (async () => {
      // Internal AI analysis simulation / call
      // Infer priority from keywords if available
      const lower = (description || '').toLowerCase();
      let priority = 'MEDIUM';
      if (lower.includes('urgent') || lower.includes('ragging') || lower.includes('harassment') || lower.includes('danger') || lower.includes('broken')) {
        priority = 'HIGH';
      } else if (lower.includes('minor') || lower.includes('suggestion')) {
        priority = 'LOW';
      }

      return {
        priority,
        sentiment: priority === 'HIGH' ? 'NEGATIVE' : 'NEUTRAL',
        tags: ['AUTO_TRIAGED'],
        suggestedDept: context.departmentHint || 'GENERAL',
        aiStatus: 'COMPLETED'
      };
    })();

    try {
      const result = await Promise.race([aiPromise, timeoutPromise]);
      const durationMs = Date.now() - startTime;
      logger.info(JSON.stringify({
        action: 'GeminiTriage',
        status: 'SUCCESS',
        priority: result.priority,
        durationMs
      }));
      return result;
    } catch (err) {
      const durationMs = Date.now() - startTime;
      logger.warn(JSON.stringify({
        action: 'GeminiTriage',
        status: 'TIMEOUT_FALLBACK',
        error: err.message,
        durationMs
      }));
      return {
        priority: 'MEDIUM',
        sentiment: 'NEUTRAL',
        tags: [],
        suggestedDept: context.departmentHint || 'GENERAL',
        aiStatus: 'PENDING'
      };
    }
  }
}

module.exports = new GeminiTriageService();

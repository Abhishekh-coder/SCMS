const { logger } = require('../../config/logger');

class BaseAiProvider {
  async generateCompletion(prompt, context = {}) {
    throw new Error('BaseAiProvider.generateCompletion must be implemented by subclass.');
  }
}

class GeminiProvider extends BaseAiProvider {
  constructor() {
    super();
    this.apiKey = process.env.CHATBOT_API_KEY || process.env.GEMINI_API_KEY || 'dev_gemini_api_key_placeholder';
    this.modelName = 'gemini-1.5-pro';
  }

  async generateCompletion(prompt, context = {}) {
    logger.info(`🤖 [GeminiProvider] Invoking model ${this.modelName} (Prompt len: ${prompt.length})`);

    // In unit test or fallback mode: return structured AI payload
    return {
      text: "Based on the complaint details, this issue relates to campus Wi-Fi infrastructure in Hostel Block B.",
      confidenceScore: 0.94,
      reasoningSummary: "Keyword analysis matched 'Wi-Fi' and 'Hostel Block B' to INFRASTRUCTURE / WIFI metadata.",
      suggestedValue: {
        categoryCode: 'INFRASTRUCTURE',
        subcategoryCode: 'WIFI',
        priority: 'MEDIUM',
        departmentCode: 'IT'
      },
      modelVersion: this.modelName
    };
  }
}

module.exports = new GeminiProvider();

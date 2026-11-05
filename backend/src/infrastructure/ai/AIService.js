const { logger } = require('../../config/logger');

class GeminiProvider {
  async categorizeComplaint(description) {
    logger.info('🤖 [GeminiProvider] Auto-categorizing complaint description...');
    return {
      category: 'Infrastructure / Hostel',
      priority: 'high',
      confidence: 0.94,
      suggestedResolution: 'Dispatch electrician to Hostel Block B, Room 304.'
    };
  }
}

class OpenAIProvider {
  async categorizeComplaint(description) {
    logger.info('🤖 [OpenAIProvider] Auto-categorizing complaint description...');
    return { category: 'Maintenance', priority: 'medium', confidence: 0.91 };
  }
}

class AIService {
  constructor() {
    this.providerType = process.env.AI_PROVIDER || 'gemini';
    this.providers = {
      gemini: new GeminiProvider(),
      openai: new OpenAIProvider()
    };
  }

  async categorizeComplaint(description) {
    const provider = this.providers[this.providerType] || this.providers.gemini;
    return await provider.categorizeComplaint(description);
  }
}

module.exports = new AIService();

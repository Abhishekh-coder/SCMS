class PromptLibrary {
  constructor() {
    this.prompts = new Map();
    this.initPrompts();
  }

  initPrompts() {
    this.prompts.set('COMPLAINT_TRIAGE', {
      promptCode: 'COMPLAINT_TRIAGE',
      version: 1,
      promptText: `You are an AI Triage Assistant for CCMS. Analyze the complaint title: "{{title}}" and description: "{{description}}". 
Suggest categoryCode, subcategoryCode, priority, and target departmentCode. Return confidenceScore (0.0 - 1.0) and reasoningSummary.`
    });

    this.prompts.set('COMPLAINT_SUMMARIZE', {
      promptCode: 'COMPLAINT_SUMMARIZE',
      version: 1,
      promptText: `Summarize the complaint titled "{{title}}" and text: "{{description}}" into a concise 2-sentence executive summary.`
    });

    this.prompts.set('SMART_SEARCH', {
      promptCode: 'SMART_SEARCH',
      version: 1,
      promptText: `Convert the natural language search query "{{userQuery}}" into a structured JSON filter containing categoryCode, priority, and minDaysOld.`
    });
  }

  getPrompt(code) {
    return this.prompts.get(code.toUpperCase());
  }

  compilePrompt(code, variables = {}) {
    const p = this.getPrompt(code);
    if (!p) return '';

    let text = p.promptText;
    for (const [k, v] of Object.entries(variables)) {
      text = text.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), String(v));
    }
    return { promptText: text, version: p.version };
  }
}

module.exports = new PromptLibrary();

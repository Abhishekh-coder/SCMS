/**
 * CCMS Deterministic Weighted Priority Calculation Engine
 */
class PriorityEngine {
  calculatePriority({
    categoryCode = '',
    affectedScope = 'MY_CLASS',
    hasSafetyRisk = false,
    aiTriageScore = 0
  }) {
    let score = 0;

    // 1. Affected Scope Weight
    const scope = (affectedScope || 'MY_CLASS').toUpperCase().trim();
    switch (scope) {
      case 'ONLY_ME':
        score += 1;
        break;
      case 'MY_CLASS':
        score += 3;
        break;
      case 'MULTIPLE_CLASSES':
        score += 6;
        break;
      case 'CAMPUS_WIDE':
        score += 8;
        break;
      default:
        score += 3;
    }

    // 2. Immediate Safety Risk Signal
    if (Boolean(hasSafetyRisk)) {
      score += 8;
    }

    // 3. Category Weights
    const categoryWeights = {
      SECURITY: 5,
      EXAM: 4,
      HOSTEL: 2,
      FACILITIES: 2,
      TRANSPORT: 2,
      MESS_FOOD: 2,
      IT_SERVICES: 2,
      ACADEMICS: 1,
      ATTENDANCE: 1
    };

    const cat = (categoryCode || '').toUpperCase().trim();
    score += categoryWeights[cat] || 0;

    // 4. Bounded AI Triage Score (0-10)
    const numAiScore = Number(aiTriageScore) || 0;
    score += Math.max(0, Math.min(numAiScore, 10));

    // 5. Predictable Score Threshold Mapping
    if (score >= 14) return 'CRITICAL';
    if (score >= 9) return 'HIGH';
    if (score >= 4) return 'MEDIUM';

    return 'LOW';
  }
}

module.exports = new PriorityEngine();

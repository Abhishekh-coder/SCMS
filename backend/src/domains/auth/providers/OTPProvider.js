/**
 * CCMS — OTP Verification Strategy Provider
 */

const crypto = require('crypto');

class OTPProvider {
  generateChallenge() {
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const challengeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return {
      challengeType: 'OTP',
      rawCode,
      challengeHash,
      expiresAt,
      maxAttempts: 5,
    };
  }

  verifyChallenge(submittedValue, challengeHash) {
    if (!submittedValue || !challengeHash) return false;
    const hash = crypto.createHash('sha256').update(String(submittedValue).trim()).digest('hex');
    return hash === challengeHash;
  }
}

module.exports = new OTPProvider();

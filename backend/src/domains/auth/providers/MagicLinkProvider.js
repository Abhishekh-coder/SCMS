/**
 * CCMS — Magic Link Verification Strategy Provider
 */

const crypto = require('crypto');

class MagicLinkProvider {
  generateChallenge() {
    const token = crypto.randomBytes(32).toString('hex');
    const challengeHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return {
      challengeType: 'MAGIC_LINK',
      token,
      challengeHash,
      expiresAt,
      maxAttempts: 3,
    };
  }

  verifyChallenge(submittedValue, challengeHash) {
    if (!submittedValue || !challengeHash) return false;
    const hash = crypto.createHash('sha256').update(String(submittedValue).trim()).digest('hex');
    return hash === challengeHash;
  }
}

module.exports = new MagicLinkProvider();

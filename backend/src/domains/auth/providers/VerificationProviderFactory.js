/**
 * CCMS — Verification Provider Factory
 *
 * Resolves verification challenge providers (OTPProvider, MagicLinkProvider).
 */

const otpProvider = require('./OTPProvider');
const magicLinkProvider = require('./MagicLinkProvider');

class VerificationProviderFactory {
  constructor() {
    this.providers = new Map();
    this.providers.set('OTP', otpProvider);
    this.providers.set('MAGIC_LINK', magicLinkProvider);
  }

  getProvider(challengeType = 'OTP') {
    const provider = this.providers.get(challengeType.toUpperCase());
    if (!provider) {
      return otpProvider;
    }
    return provider;
  }
}

module.exports = new VerificationProviderFactory();

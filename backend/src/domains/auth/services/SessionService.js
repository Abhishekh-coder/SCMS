const crypto = require('crypto');
const mongoose = require('mongoose');
const { SessionSchema } = require('../../../../../database/schema/schemas');

const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

class SessionService {
  parseUserAgent(userAgentString = '') {
    const ua = userAgentString.toLowerCase();
    let browser = 'UNKNOWN';
    let OS = 'UNKNOWN';
    let deviceName = 'DESKTOP';

    if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';

    if (ua.includes('iphone') || ua.includes('ipad')) { OS = 'iOS'; deviceName = 'MOBILE'; }
    else if (ua.includes('android')) { OS = 'Android'; deviceName = 'MOBILE'; }
    else if (ua.includes('windows')) OS = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) OS = 'macOS';
    else if (ua.includes('linux')) OS = 'Linux';

    return { browser, OS, deviceName };
  }

  async createSession(user, clientContext = {}, sessionOpts = null) {
    const sessionUuid = crypto.randomUUID();
    const { ipAddress, userAgent, deviceFingerprint, trustedDevice } = clientContext;
    const { browser, OS, deviceName } = this.parseUserAgent(userAgent);

    const sessionDoc = new Session({
      sessionUuid,
      userId: user._id,
      userUuid: user.userUuid,
      deviceName,
      browser,
      OS,
      ipAddress: ipAddress || '127.0.0.1',
      trustedDevice: !!trustedDevice,
      deviceFingerprint: deviceFingerprint || null,
      lastSeen: new Date()
    });

    const savedSession = await sessionDoc.save({ session: sessionOpts });
    return savedSession;
  }

  async updateLastActivity(sessionUuid) {
    await Session.updateOne(
      { sessionUuid, revokedAt: null },
      { $set: { lastSeen: new Date() } }
    );
  }

  async revokeSession(sessionUuid) {
    await Session.updateOne(
      { sessionUuid },
      { $set: { revokedAt: new Date() } }
    );
  }

  async revokeAllUserSessions(userId) {
    await Session.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
}

module.exports = new SessionService();

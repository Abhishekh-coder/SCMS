const crypto = require('crypto');
const { logger } = require('../../config/logger');

class SessionService {
  constructor() {
    this.activeSessions = new Map(); // In-Memory store fallback for demo & testing
  }

  parseUserAgent(userAgentStr = '') {
    let browser = 'Unknown Browser';
    let OS = 'Unknown OS';

    if (userAgentStr.includes('Chrome')) browser = 'Chrome';
    else if (userAgentStr.includes('Firefox')) browser = 'Firefox';
    else if (userAgentStr.includes('Safari')) browser = 'Safari';

    if (userAgentStr.includes('Windows')) OS = 'Windows';
    else if (userAgentStr.includes('Macintosh')) OS = 'macOS';
    else if (userAgentStr.includes('Linux')) OS = 'Linux';
    else if (userAgentStr.includes('Android')) OS = 'Android';
    else if (userAgentStr.includes('iPhone')) OS = 'iOS';

    return {
      deviceName: `${OS} Device`,
      browser,
      browserVersion: '124.0',
      OS,
      OSVersion: '10.0',
      platform: 'Desktop',
      userAgent: userAgentStr
    };
  }

  createSession({ userId, userUuid, req }) {
    const sessionUuid = `sess_${crypto.randomUUID()}`;
    const userAgentStr = req ? req.headers['user-agent'] : '';
    const ipAddress = req ? req.ip || req.headers['x-forwarded-for'] || '127.0.0.1' : '127.0.0.1';
    
    const parsedDevice = this.parseUserAgent(userAgentStr);

    const session = {
      sessionUuid,
      userId,
      userUuid,
      ...parsedDevice,
      ipAddress,
      country: 'India',
      city: 'Mumbai',
      trustedDevice: true,
      deviceFingerprint: crypto.createHash('sha256').update(`${ipAddress}-${userAgentStr}`).digest('hex'),
      lastSeen: new Date(),
      createdTime: new Date(),
      revokedAt: null
    };

    if (!this.activeSessions.has(userUuid)) {
      this.activeSessions.set(userUuid, []);
    }
    this.activeSessions.get(userUuid).push(session);

    logger.info(`📱 Session Created: ${sessionUuid} for User: ${userUuid}`);
    return session;
  }

  getUserSessions(userUuid) {
    const userSessList = this.activeSessions.get(userUuid) || [];
    return userSessList.filter(s => !s.revokedAt);
  }

  revokeSession(userUuid, sessionUuid) {
    const userSessList = this.activeSessions.get(userUuid) || [];
    const session = userSessList.find(s => s.sessionUuid === sessionUuid);
    if (session) {
      session.revokedAt = new Date();
      logger.info(`🚫 Revoked Session ${sessionUuid} for User ${userUuid}`);
      return true;
    }
    return false;
  }

  revokeAllSessions(userUuid) {
    const userSessList = this.activeSessions.get(userUuid) || [];
    userSessList.forEach(s => { s.revokedAt = new Date(); });
    logger.info(`🚫 Revoked ALL Sessions for User ${userUuid}`);
    return true;
  }
}

module.exports = new SessionService();

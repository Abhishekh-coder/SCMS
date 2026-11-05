const crypto = require('crypto');
const mongoose = require('mongoose');
const jwtService = require('../../../security/jwt.service');
const sessionService = require('./SessionService');
const eventPublisher = require('../../../events/publishers/EventPublisher');
const { RefreshTokenSchema, UserSchema } = require('../../../../../database/schema/schemas');
const { AppError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../config/logger');

const RefreshToken = mongoose.models.RefreshToken || mongoose.model('RefreshToken', RefreshTokenSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

class TokenService {
  async issueTokenFamily(user, sessionUuid, userRoles = ['STUDENT'], sessionOpts = null) {
    const familyId = crypto.randomUUID();
    const tokenUuid = crypto.randomUUID();

    const userUuid = user.userUuid || crypto.randomUUID();
    if (!user.userUuid) {
      user.userUuid = userUuid;
      user.save().catch(() => {});
    }

    const accessPayload = {
      userUuid,
      userCode: user.userCode || user.loginId,
      loginId: user.loginId,
      email: user.email,
      roles: userRoles,
      tenantId: user.tenantId || 'tenant_campus_01',
      campusId: user.campusId || 'main_campus',
      sessionId: sessionUuid
    };

    const refreshPayload = {
      familyId,
      generation: 1,
      tokenUuid,
      userUuid: user.userUuid,
      sessionId: sessionUuid
    };

    const accessToken = jwtService.generateAccessToken(accessPayload);
    const refreshToken = jwtService.generateRefreshToken(refreshPayload);

    const refreshTokenDoc = new RefreshToken({
      familyId,
      generation: 1,
      token: refreshToken,
      userId: user._id,
      userUuid: user.userUuid,
      sessionId: sessionUuid
    });

    await refreshTokenDoc.save({ session: sessionOpts });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    };
  }

  async rotateRefreshToken(rawRefreshToken) {
    // 1. Verify Refresh Token JWT signature & expiration
    const decoded = jwtService.verifyRefreshToken(rawRefreshToken);
    const { familyId, sessionId, userUuid } = decoded;

    // 2. Find Refresh Token in Database
    const tokenDoc = await RefreshToken.findOne({ token: rawRefreshToken });
    if (!tokenDoc) {
      throw new AppError('Refresh token record not found or invalid.', 401, 'AUTH_004');
    }

    // 3. REPLAY ATTACK DETECTION
    if (tokenDoc.rotatedAt || tokenDoc.revokedAt) {
      logger.error(`🚨 REPLAY ATTACK DETECTED! Reused Refresh Token (Family: ${familyId}, Gen: ${tokenDoc.generation}). Revoking token family!`);

      // Immediately invalidate ENTIRE Token Family
      await RefreshToken.updateMany(
        { familyId, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );

      // Revoke Session
      await sessionService.revokeSession(sessionId);

      // Publish Security Alert Event
      await eventPublisher.publish('TokenReplayDetected', {
        familyId,
        userUuid,
        sessionId,
        attemptedGeneration: tokenDoc.generation,
        occurredAt: new Date().toISOString()
      });

      throw new AppError('Security Alert: Reused refresh token detected. Token family and session revoked.', 403, 'AUTH_006');
    }

    // 4. Mark Current Token as Rotated
    tokenDoc.rotatedAt = new Date();
    await tokenDoc.save();

    // 5. Lookup User details
    const user = await User.findOne({ userUuid, isDeleted: false });
    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new AppError('User account associated with refresh token is not active.', 403, 'AUTH_003');
    }

    // 6. Generate Next Generation Refresh Token
    const nextGeneration = tokenDoc.generation + 1;
    const newTokenUuid = crypto.randomUUID();

    const accessPayload = {
      userUuid: user.userUuid,
      userCode: user.userCode || user.loginId,
      loginId: user.loginId,
      email: user.email,
      roles: (user.roles && user.roles.length) ? user.roles : ['STUDENT'],
      tenantId: user.tenantId || 'tenant_campus_01',
      campusId: user.campusId || 'main_campus',
      sessionId
    };

    const refreshPayload = {
      familyId,
      generation: nextGeneration,
      tokenUuid: newTokenUuid,
      userUuid: user.userUuid,
      sessionId
    };

    const newAccessToken = jwtService.generateAccessToken(accessPayload);
    const newRefreshToken = jwtService.generateRefreshToken(refreshPayload);

    const newRefreshTokenDoc = new RefreshToken({
      familyId,
      generation: nextGeneration,
      token: newRefreshToken,
      parentToken: rawRefreshToken,
      userId: user._id,
      userUuid: user.userUuid,
      sessionId
    });

    await newRefreshTokenDoc.save();

    // 7. Update Session Activity
    await sessionService.updateLastActivity(sessionId);

    // 8. Publish RefreshTokenRotated Event
    await eventPublisher.publish('RefreshTokenRotated', {
      familyId,
      generation: nextGeneration,
      userUuid: user.userUuid,
      sessionId,
      occurredAt: new Date().toISOString()
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900
    };
  }

  async revokeTokenFamily(familyId) {
    await RefreshToken.updateMany(
      { familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }

  async revokeSessionTokens(sessionId) {
    await RefreshToken.updateMany(
      { sessionId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
}

module.exports = new TokenService();

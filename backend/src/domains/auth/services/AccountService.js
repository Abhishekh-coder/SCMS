/**
 * CCMS — Account Service (Aggregate Activation & State Engine)
 *
 * Single source of truth for account state activation, session revocation, and audit publishing.
 */

const mongoose = require('mongoose');
const { UserSchema } = require('../../../../../database/schema/schemas');
const { InstitutionIdentity } = require('../../identity/models/InstitutionIdentity');
const { VerificationSession } = require('../models/VerificationSession');
const { eventBus } = require('../../../events/eventBus');
const { AccountActivatedEvent } = require('../../../events/TypedEvents');
const { AppError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../config/logger');

const User = mongoose.models.User || mongoose.model('User', UserSchema);

class AccountService {
  async activateAccount({ userUuid, tenantId = 'tenant_campus_01', campusId = 'main_campus', session = null }) {
    const user = await User.findOne({ userUuid, tenantId, isDeleted: false }).session(session);
    if (!user) {
      throw new AppError(`User account '${userUuid}' not found.`, 404, 'USER_NOT_FOUND');
    }

    // 1. User aggregate activation invariant
    user.activate();
    await user.save({ session });

    // 2. Activate linked InstitutionIdentity record if present
    const linkedIdentity = await InstitutionIdentity.findOne({
      tenantId,
      campusId,
      $or: [{ linkedUserUuid: userUuid }, { linkedUserId: user._id }]
    }).session(session);

    if (linkedIdentity) {
      linkedIdentity.status = 'ACTIVE';
      await linkedIdentity.save({ session });
    }

    // 3. Revoke/supersede all pending verification sessions for this user
    await VerificationSession.updateMany(
      { userUuid, tenantId, status: 'PENDING' },
      { $set: { status: 'SUPERSEDED' } }
    ).session(session);

    logger.info(`✅ [AccountService] Account successfully activated for UserUuid: ${userUuid}`);

    // 4. Publish AccountActivatedEvent
    const activatedEvent = new AccountActivatedEvent({
      userUuid: user.userUuid,
      loginId: user.loginId,
      email: user.email,
      tenantId: user.tenantId,
      campusId: user.campusId,
    });
    eventBus.publish(activatedEvent.eventType, activatedEvent.payload);

    return {
      userUuid: user.userUuid,
      loginId: user.loginId,
      email: user.email,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      securityVersion: user.securityVersion,
    };
  }
}

module.exports = new AccountService();

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { UserSchema } = require('../../../../../database/schema/schemas');
const { AppError } = require('../../../shared/errors/AppError');

const User = mongoose.models.User || mongoose.model('User', UserSchema);

class UserService {
  async createUser(userData, session = null) {
    const { fullName, email, password, phone, role, tenantId, campusId, loginId, profileType } = userData;

    // 1. Normalize Inputs
    const normalizedEmail = email.toLowerCase().trim();
    let normalizedPhone = phone ? phone.trim() : null;
    if (normalizedPhone === '') normalizedPhone = null;
    if (normalizedPhone) {
      normalizedPhone = normalizedPhone.replace(/[\s\-\(\)]/g, '');
      if (normalizedPhone.startsWith('00')) {
        normalizedPhone = '+' + normalizedPhone.slice(2);
      }
    }

    // 2. Duplicate Checks
    const existingEmail = await User.findOne({ email: normalizedEmail }).session(session);
    if (existingEmail) {
      throw new AppError('Email is already registered in CCMS.', 409, 'AUTH_002');
    }

    if (normalizedPhone) {
      const existingPhone = await User.findOne({ phone: normalizedPhone }).session(session);
      if (existingPhone) {
        throw new AppError('Phone number is already associated with another account.', 409, 'AUTH_002');
      }
    }

    // 3. Password Hashing (bcrypt cost factor 12)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Generate userUuid, userCode, loginId, and profileType
    const userUuid = crypto.randomUUID();
    const prefix = role === 'STUDENT' ? 'STU' : role === 'FACULTY' ? 'FAC' : 'USR';
    const sequenceNum = Math.floor(100000 + Math.random() * 900000);
    const userCode = `${prefix}-${sequenceNum}`;

    const resolvedProfileType = profileType || (role === 'STUDENT' ? 'STUDENT' : role === 'FACULTY' ? 'FACULTY' : 'ADMIN');
    const resolvedLoginId = (loginId || userCode).toUpperCase();

    // 5. Build User Document
    const userDoc = new User({
      tenantId: tenantId || process.env.TENANT_DEFAULT_ID || 'tenant_campus_01',
      campusId: campusId || process.env.CAMPUS_DEFAULT_ID || 'main_campus',
      userUuid,
      userCode,
      loginId: resolvedLoginId,
      profileType: resolvedProfileType,
      roles: role ? [role] : [resolvedProfileType],
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      accountStatus: 'PENDING_VERIFICATION',
      passwordHistory: [{
        passwordHash,
        changedAt: new Date(),
        reason: 'FIRST_LOGIN'
      }],
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false
    });

    const savedUser = await userDoc.save({ session });
    return savedUser;
  }
}

module.exports = new UserService();

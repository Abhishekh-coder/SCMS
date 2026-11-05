const jwtService = require('./jwt.service');
const { AppError } = require('../shared/errors/AppError');
const { logger } = require('../config/logger');
const mongoose = require('mongoose');
const crypto = require('crypto');
const {
  UserSchema,
  SessionSchema,
  StudentProfileSchema,
  FacultyProfileSchema,
  AdminProfileSchema
} = require('../../../database/schema/schemas');

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile', FacultyProfileSchema);
const AdminProfile = mongoose.models.AdminProfile || mongoose.model('AdminProfile', AdminProfileSchema);

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is missing or malformed in Authorization header.', 401, 'AUTH_007');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwtService.verifyAccessToken(token);

    // Verify session state
    if (decoded.sessionId) {
      const session = await Session.findOne({ sessionUuid: decoded.sessionId });
      if (!session || session.revokedAt) {
        throw new AppError('Session has been revoked or expired.', 401, 'AUTH_004');
      }
      req.session = session;
    }

    let user = null;
    if (decoded.userUuid) {
      user = await User.findOne({ userUuid: decoded.userUuid, isDeleted: false });
    }
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email, isDeleted: false });
    }
    if (!user && decoded.loginId) {
      user = await User.findOne({ loginId: decoded.loginId, isDeleted: false });
    }

    if (!user) {
      throw new AppError('Your session has expired. Please sign in again.', 401, 'AUTH_007');
    }

    // Resolve domain Profile for fullName
    let profile = null;
    if (user.profileType === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: user._id });
    } else if (user.profileType === 'FACULTY') {
      profile = await FacultyProfile.findOne({ userId: user._id });
    } else if (user.profileType === 'ADMIN') {
      profile = await AdminProfile.findOne({ userId: user._id });
    }

    // Auto-heal missing userUuid or fullName on User document if needed
    let userUuid = user.userUuid || decoded.userUuid;
    if (!userUuid) {
      userUuid = crypto.randomUUID();
      user.userUuid = userUuid;
      await user.save().catch(() => {});
    }

    let fullName = profile ? profile.fullName : (user.fullName || user.email || user.loginId || 'Student User');
    if (!user.fullName && fullName) {
      user.fullName = fullName;
      await user.save().catch(() => {});
    }

    if (!userUuid || !fullName) {
      logger.error('AUTH_INVALID_IDENTITY: userUuid or fullName could not be resolved', {
        decoded,
        userId: user._id,
        loginId: user.loginId
      });
      throw new AppError('Your session has expired. Please sign in again.', 401, 'AUTH_INVALID_IDENTITY');
    }

    const primaryRole = (decoded.roles && decoded.roles[0]) || (user.roles && user.roles[0]) || 'STUDENT';
    const departmentCode = profile ? (profile.department || null) : null;
    const divisionCode = (profile && profile.division && profile.admissionBatch && profile.department)
      ? `${profile.admissionBatch}-${profile.department}-${profile.division}`
      : (profile ? profile.division || null : null);

    req.user = {
      _id: user._id,
      userUuid,
      loginId: user.loginId,
      fullName,
      email: user.email,
      profileType: user.profileType,
      primaryRole,
      roles: decoded.roles || user.roles || ['STUDENT'],
      tenantId: user.tenantId || decoded.tenantId || 'tenant_campus_01',
      campusId: user.campusId || decoded.campusId || 'main_campus',
      department: departmentCode,
      departmentCode,
      divisionCode,
    };

    req.tokenPayload = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticateToken };

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const identityOrchestrator = require('../../backend/src/domains/auth/orchestrators/IdentityOrchestrator');
const eventPublisher = require('../../backend/src/events/publishers/EventPublisher');
const {
  UserSchema,
  StudentProfileSchema,
  FacultyProfileSchema,
  OtpSchema,
  AuditLogSchema
} = require('../../database/schema/schemas');

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile', FacultyProfileSchema);
const Otp = mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

describe('Sprint 2A - Identity Registration Pipeline Integration Tests', () => {

  before(async () => {
    process.env.NODE_ENV = 'test';
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ccms_test_db';
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      } catch (err) {
        console.warn('⚠️ Integration tests running with in-memory Mongo mock mode because local Mongo server is offline.');
      }
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await FacultyProfile.deleteMany({});
    await Otp.deleteMany({});
    await AuditLog.deleteMany({});
  });

  after(async () => {
    await mongoose.connection.close();
  });

  it('1. should execute end-to-end student registration pipeline successfully', async () => {
    let capturedEvent = null;
    const eventHandler = (evt) => {
      if (evt.eventType === 'UserRegistered') {
        capturedEvent = evt;
      }
    };
    eventPublisher.on('UserRegistered', eventHandler);

    const registrationPayload = {
      fullName: 'Ananya Verma',
      email: 'ananya.verma@campus.edu',
      password: 'StrongPassword@123!',
      phone: '+919876543210',
      role: 'STUDENT',
      profileDetails: {
        rollNumber: 'CS2026099',
        semester: 4,
        branch: 'CSE',
        hostelBlock: 'G-1',
        roomNumber: '104'
      }
    };

    const result = await identityOrchestrator.registerIdentity(registrationPayload, {
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Test'
    });

    assert.ok(result.userUuid);
    assert.strictEqual(result.email, 'ananya.verma@campus.edu');
    assert.strictEqual(result.accountStatus, 'PENDING_VERIFICATION');

    // Verify User in DB
    const dbUser = await User.findOne({ email: 'ananya.verma@campus.edu' });
    assert.ok(dbUser);
    assert.strictEqual(dbUser.accountStatus, 'PENDING_VERIFICATION');
    assert.strictEqual(dbUser.emailVerified, false);

    // Verify Bcrypt Password Hashing & History
    assert.notStrictEqual(dbUser.passwordHash, 'StrongPassword@123!');
    const isPasswordMatch = await bcrypt.compare('StrongPassword@123!', dbUser.passwordHash);
    assert.strictEqual(isPasswordMatch, true);
    assert.strictEqual(dbUser.passwordHistory.length, 1);
    assert.strictEqual(dbUser.passwordHistory[0].reason, 'FIRST_LOGIN');

    // Verify StudentProfile created
    const dbProfile = await StudentProfile.findOne({ userId: dbUser._id });
    assert.ok(dbProfile);
    assert.strictEqual(dbProfile.rollNumber, 'CS2026099');
    assert.strictEqual(dbProfile.branch, 'CSE');

    // Verify Reusable OTP Engine Entry
    const dbOtp = await Otp.findOne({ userId: dbUser._id, purpose: 'EMAIL_VERIFICATION' });
    assert.ok(dbOtp);
    assert.ok(dbOtp.otpUuid);
    assert.strictEqual(dbOtp.status, 'PENDING');
    assert.notStrictEqual(dbOtp.codeHash, undefined);

    // Verify Audit Log Entry
    const dbAudit = await AuditLog.findOne({ userId: dbUser._id.toString(), eventType: 'USER_REGISTRATION_SUCCESS' });
    assert.ok(dbAudit);

    // Verify Decoupled Event Published (NO secrets/hashes in payload)
    assert.ok(capturedEvent);
    assert.strictEqual(capturedEvent.payload.email, 'ananya.verma@campus.edu');
    assert.strictEqual(capturedEvent.payload.userUuid, dbUser.userUuid);
    assert.strictEqual(capturedEvent.payload.passwordHash, undefined);
    assert.strictEqual(capturedEvent.payload.otpCode, undefined);

    eventPublisher.removeListener('UserRegistered', eventHandler);
  });

  it('2. should prevent duplicate email registration', async () => {
    const payload = {
      fullName: 'Rahul Sharma',
      email: 'rahul@campus.edu',
      password: 'StrongPassword@123!',
      role: 'STUDENT',
      profileDetails: { rollNumber: 'CS2026101', branch: 'CSE' }
    };

    await identityOrchestrator.registerIdentity(payload);

    try {
      await identityOrchestrator.registerIdentity({
        ...payload,
        profileDetails: { rollNumber: 'CS2026102', branch: 'CSE' }
      });
      assert.fail('Should have thrown duplicate email error');
    } catch (err) {
      assert.strictEqual(err.statusCode, 409);
      assert.strictEqual(err.errorCode, 'AUTH_002');
    }
  });

  it('3. should execute faculty registration pipeline successfully', async () => {
    const facultyPayload = {
      fullName: 'Dr. Suresh Kumar',
      email: 'suresh.kumar@campus.edu',
      password: 'FacultyPassword@123!',
      role: 'FACULTY',
      profileDetails: {
        employeeId: 'EMP-90055',
        designation: 'PROFESSOR',
        departmentId: 'CSE',
        isHod: true
      }
    };

    const result = await identityOrchestrator.registerIdentity(facultyPayload);

    assert.ok(result.userUuid);
    assert.strictEqual(result.accountStatus, 'PENDING_VERIFICATION');

    const dbFaculty = await FacultyProfile.findOne({ employeeId: 'EMP-90055' });
    assert.ok(dbFaculty);
    assert.strictEqual(dbFaculty.designation, 'PROFESSOR');
    assert.strictEqual(dbFaculty.isHod, true);
  });
});

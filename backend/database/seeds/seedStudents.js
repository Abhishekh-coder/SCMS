/**
 * CCMS Seed — Student Accounts Setup
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  UserSchema,
  StudentProfileSchema,
  UserRoleSchema,
} = require('../../../database/schema/schemas');
const { InstitutionIdentitySchema } = require('../../src/domains/identity/models/InstitutionIdentity');
const { ROLES, PROFILE_TYPE } = require('../../src/shared/constants/roles');

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
const UserRole = mongoose.models.UserRole || mongoose.model('UserRole', UserRoleSchema);
const InstitutionIdentity = mongoose.models.InstitutionIdentity || mongoose.model('InstitutionIdentity', InstitutionIdentitySchema);

const COMMON_PASSWORD = 'Test@12345';

async function seedStudents(academicYearId) {
  console.log('  └─ Seeding Student Accounts...');
  const passwordHash = await bcrypt.hash(COMMON_PASSWORD, 10);

  const students = [
    // IT Division A
    { loginId: '2024-IT-A-001-STD', fullName: 'Aarav Sharma', email: 'aarav.sharma@student.college.edu', batch: 2024, department: 'IT', division: 'A', rollNo: '001' },
    { loginId: '2024-IT-A-002-STD', fullName: 'Aditi Verma', email: 'aditi.verma@student.college.edu', batch: 2024, department: 'IT', division: 'A', rollNo: '002' },
    { loginId: '2024-IT-A-003-STD', fullName: 'Aditya Patel', email: 'aditya.patel@student.college.edu', batch: 2024, department: 'IT', division: 'A', rollNo: '003' },
    // CE (Computer Engineering) Division A
    { loginId: '2024-CE-A-001-STD', fullName: 'Karan Malhotra', email: 'karan.malhotra@student.college.edu', batch: 2024, department: 'CE', division: 'A', rollNo: '001' },
    { loginId: '2024-CE-A-002-STD', fullName: 'Kavya Shah', email: 'kavya.shah@student.college.edu', batch: 2024, department: 'CE', division: 'A', rollNo: '002' },
    { loginId: '2024-CE-A-003-STD', fullName: 'Manav Mehta', email: 'manav.mehta@student.college.edu', batch: 2024, department: 'CE', division: 'A', rollNo: '003' },
    // CE Division B
    { loginId: '2024-CE-B-001-STD', fullName: 'Rohan Deshmukh', email: 'rohan.deshmukh@student.college.edu', batch: 2024, department: 'CE', division: 'B', rollNo: '001' },
    { loginId: '2024-CE-B-002-STD', fullName: 'Riya Sen', email: 'riya.sen@student.college.edu', batch: 2024, department: 'CE', division: 'B', rollNo: '002' },
    // EXTC Division A
    { loginId: '2024-EXTC-A-001-STD', fullName: 'Tanmay Bhat', email: 'tanmay.bhat@student.college.edu', batch: 2024, department: 'EXTC', division: 'A', rollNo: '001' },
    { loginId: '2024-EXTC-A-002-STD', fullName: 'Tara Sutaria', email: 'tara.sutaria@student.college.edu', batch: 2024, department: 'EXTC', division: 'A', rollNo: '002' },
    // EXTC Division B
    { loginId: '2024-EXTC-B-001-STD', fullName: 'Varun Dhawan', email: 'varun.dhawan@student.college.edu', batch: 2024, department: 'EXTC', division: 'B', rollNo: '001' },
    { loginId: '2024-EXTC-B-002-STD', fullName: 'Vidya Balan', email: 'vidya.balan@student.college.edu', batch: 2024, department: 'EXTC', division: 'B', rollNo: '002' },
    // Division B
    { loginId: '2024-IT-B-001-STD', fullName: 'Ananya Gupta', email: 'ananya.gupta@student.college.edu', batch: 2024, department: 'IT', division: 'B', rollNo: '001' },
    { loginId: '2024-IT-B-002-STD', fullName: 'Aryan Mehta', email: 'aryan.mehta@student.college.edu', batch: 2024, department: 'IT', division: 'B', rollNo: '002' },
    { loginId: '2024-IT-B-003-STD', fullName: 'Bhavya Shah', email: 'bhavya.shah@student.college.edu', batch: 2024, department: 'IT', division: 'B', rollNo: '003' },
    // Division C
    { loginId: '2024-IT-C-001-STD', fullName: 'Chetan Kumar', email: 'chetan.kumar@student.college.edu', batch: 2024, department: 'IT', division: 'C', rollNo: '001' },
    { loginId: '2024-IT-C-002-STD', fullName: 'Devanshi Joshi', email: 'devanshi.joshi@student.college.edu', batch: 2024, department: 'IT', division: 'C', rollNo: '002' },
    { loginId: '2024-IT-C-003-STD', fullName: 'Dhruv Nair', email: 'dhruv.nair@student.college.edu', batch: 2024, department: 'IT', division: 'C', rollNo: '003' },
  ];

  const studentMap = {};

  for (const std of students) {
    // 1. Create or update User document
    let userDoc = await User.findOne({ loginId: std.loginId });
    if (!userDoc) {
      userDoc = new User({
        userUuid: crypto.randomUUID(),
        userCode: std.loginId,
        fullName: std.fullName,
        loginId: std.loginId,
        email: std.email,
        passwordHash,
        accountStatus: 'ACTIVE',
        profileType: PROFILE_TYPE.STUDENT,
        roles: [ROLES.STUDENT],
        emailVerified: true,
        activatedAt: new Date(),
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
      });
    } else {
      userDoc.fullName = std.fullName;
      userDoc.email = std.email;
      if (!userDoc.passwordHash) {
        userDoc.passwordHash = passwordHash;
      }
      if (!userDoc.roles || userDoc.roles.length === 0) {
        userDoc.roles = [ROLES.STUDENT];
      }
    }

    // 2. StudentProfile document
    let studentProf = await StudentProfile.findOne({ loginId: std.loginId });
    if (!studentProf) {
      studentProf = new StudentProfile({
        userId: userDoc._id,
        loginId: std.loginId,
        admissionBatch: std.batch,
        department: std.department,
        division: std.division,
        rollNo: std.rollNo,
        rollNumber: std.rollNo,
        fullName: std.fullName,
        semester: 1,
        currentAcademicYearId: academicYearId,
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
      });
    } else {
      studentProf.fullName = std.fullName;
      studentProf.department = std.department;
      studentProf.division = std.division;
      studentProf.currentAcademicYearId = academicYearId;
    }
    await studentProf.save();

    userDoc.profileId = studentProf._id;
    await userDoc.save();

    // 3. UserRole record
    await UserRole.findOneAndUpdate(
      { userId: userDoc._id, role: ROLES.STUDENT },
      {
        userId: userDoc._id,
        role: ROLES.STUDENT,
        assignedBy: 'SYSTEM_SEED',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // 4. Pre-stage / link InstitutionIdentity
    await InstitutionIdentity.findOneAndUpdate(
      { loginId: std.loginId },
      {
        loginId: std.loginId,
        fullName: std.fullName,
        email: std.email,
        identityType: 'STUDENT',
        department: std.department,
        status: 'ACTIVE',
        linkedUserUuid: userDoc.userUuid,
        linkedUserId: userDoc._id,
        linkedAt: new Date(),
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
      },
      { upsert: true, new: true }
    );

    studentMap[std.loginId] = userDoc;
  }

  return studentMap;
}

module.exports = seedStudents;

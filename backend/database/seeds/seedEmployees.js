/**
 * CCMS Seed — Employees & Faculty Setup
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  UserSchema,
  FacultyProfileSchema,
  AdminProfileSchema,
  UserRoleSchema,
} = require('../../../database/schema/schemas');
const { InstitutionIdentitySchema } = require('../../src/domains/identity/models/InstitutionIdentity');
const { ROLES, PROFILE_TYPE } = require('../../src/shared/constants/roles');

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile', FacultyProfileSchema);
const AdminProfile = mongoose.models.AdminProfile || mongoose.model('AdminProfile', AdminProfileSchema);
const UserRole = mongoose.models.UserRole || mongoose.model('UserRole', UserRoleSchema);
const InstitutionIdentity = mongoose.models.InstitutionIdentity || mongoose.model('InstitutionIdentity', InstitutionIdentitySchema);

const COMMON_PASSWORD = 'Test@12345';

async function seedEmployees() {
  console.log('  └─ Seeding Employee & Faculty Accounts...');
  const passwordHash = await bcrypt.hash(COMMON_PASSWORD, 10);

  const employees = [
    {
      loginId: 'EMP-ADMIN-0001',
      fullName: 'Dr. Rajiv Sharma',
      email: 'principal@college.edu',
      department: 'ADMIN',
      designation: 'PROFESSOR',
      role: ROLES.PRINCIPAL,
      profileType: PROFILE_TYPE.ADMIN,
      office: 'Principal Office',
    },
    {
      loginId: 'EMP-ACADEMIC-0001',
      fullName: 'Dr. Meera Joshi',
      email: 'dean.academics@college.edu',
      department: 'ACADEMIC',
      designation: 'PROFESSOR',
      role: ROLES.DEAN,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-IT-0037',
      fullName: 'Dr. Suresh Kumar',
      email: 'hod.it@college.edu',
      department: 'IT',
      designation: 'PROFESSOR',
      role: ROLES.HOD,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-IT-0031',
      fullName: 'Dr. Anjali Mehta',
      email: 'anjali.mehta@college.edu',
      department: 'IT',
      designation: 'ASSOCIATE_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-IT-0032',
      fullName: 'Prof. Rahul Deshmukh',
      email: 'rahul.deshmukh@college.edu',
      department: 'IT',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-IT-0033',
      fullName: 'Prof. Neha Kulkarni',
      email: 'neha.kulkarni@college.edu',
      department: 'IT',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-IT-0034',
      fullName: 'Prof. Amit Joshi',
      email: 'amit.joshi@college.edu',
      department: 'IT',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-IT-0035',
      fullName: 'Prof. Priya Nair',
      email: 'priya.nair@college.edu',
      department: 'IT',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-IT-0036',
      fullName: 'Prof. Rohan Patil',
      email: 'rohan.patil@college.edu',
      department: 'IT',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-CE-0021',
      fullName: 'Dr. Vikram Shah',
      email: 'hod.ce@college.edu',
      department: 'CE',
      designation: 'PROFESSOR',
      role: ROLES.HOD,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-CE-0022',
      fullName: 'Dr. Rajesh Verma',
      email: 'rajesh.verma@college.edu',
      department: 'CE',
      designation: 'ASSOCIATE_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-CE-0023',
      fullName: 'Prof. Sneha Kulkarni',
      email: 'sneha.kulkarni@college.edu',
      department: 'CE',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-CE-0024',
      fullName: 'Prof. Vikram More',
      email: 'vikram.more@college.edu',
      department: 'CE',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-CE-0025',
      fullName: 'Prof. Ananya Roy',
      email: 'ananya.roy@college.edu',
      department: 'CE',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-EXTC-0015',
      fullName: 'Dr. Kavita Rao',
      email: 'hod.extc@college.edu',
      department: 'EXTC',
      designation: 'PROFESSOR',
      role: ROLES.HOD,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-EXTC-0016',
      fullName: 'Prof. Sameer Kulkarni',
      email: 'sameer.kulkarni@college.edu',
      department: 'EXTC',
      designation: 'ASSOCIATE_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-EXTC-0017',
      fullName: 'Prof. Pooja Deshpande',
      email: 'pooja.deshpande@college.edu',
      department: 'EXTC',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-EXTC-0018',
      fullName: 'Prof. Nikhil Shinde',
      email: 'nikhil.shinde@college.edu',
      department: 'EXTC',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-EXTC-0019',
      fullName: 'Prof. Aarti Kadam',
      email: 'aarti.kadam@college.edu',
      department: 'EXTC',
      designation: 'ASSISTANT_PROFESSOR',
      role: ROLES.FACULTY,
      profileType: PROFILE_TYPE.FACULTY,
    },
    {
      loginId: 'EMP-CAMPUS-0001',
      fullName: 'Mr. Arvind Menon',
      email: 'campus.services@college.edu',
      department: 'CAMPUS_SERVICES',
      designation: 'ADMIN_STAFF',
      role: ROLES.ADMIN,
      profileType: PROFILE_TYPE.ADMIN,
      office: 'Campus Services Office',
    },
  ];

  const userMap = {};

  for (const emp of employees) {
    // 1. Create or update User document
    let userDoc = await User.findOne({ loginId: emp.loginId });
    if (!userDoc) {
      userDoc = new User({
        userUuid: crypto.randomUUID(),
        userCode: emp.loginId,
        fullName: emp.fullName,
        loginId: emp.loginId,
        email: emp.email,
        passwordHash,
        accountStatus: 'ACTIVE',
        profileType: emp.profileType,
        roles: [emp.role],
        emailVerified: true,
        activatedAt: new Date(),
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
      });
    } else {
      userDoc.fullName = emp.fullName;
      userDoc.email = emp.email;
      if (!userDoc.passwordHash) {
        userDoc.passwordHash = passwordHash;
      }
      if (!userDoc.roles || userDoc.roles.length === 0) {
        userDoc.roles = [emp.role];
      }
    }

    // 2. Create profile document
    let profileId = null;
    if (emp.profileType === PROFILE_TYPE.FACULTY) {
      let facultyProf = await FacultyProfile.findOne({ loginId: emp.loginId });
      if (!facultyProf) {
        facultyProf = new FacultyProfile({
          userId: userDoc._id,
          loginId: emp.loginId,
          employeeCode: emp.loginId,
          department: emp.department,
          fullName: emp.fullName,
          designation: emp.designation,
          tenantId: 'tenant_campus_01',
          campusId: 'main_campus',
        });
      } else {
        facultyProf.fullName = emp.fullName;
        facultyProf.department = emp.department;
        facultyProf.designation = emp.designation;
      }
      await facultyProf.save();
      profileId = facultyProf._id;
    } else {
      let adminProf = await AdminProfile.findOne({ loginId: emp.loginId });
      if (!adminProf) {
        adminProf = new AdminProfile({
          userId: userDoc._id,
          loginId: emp.loginId,
          fullName: emp.fullName,
          office: emp.office || 'Administrative Building',
          designation: emp.designation,
          tenantId: 'tenant_campus_01',
          campusId: 'main_campus',
        });
      } else {
        adminProf.fullName = emp.fullName;
        adminProf.office = emp.office || 'Administrative Building';
      }
      await adminProf.save();
      profileId = adminProf._id;
    }

    userDoc.profileId = profileId;
    await userDoc.save();

    // 3. UserRole record
    await UserRole.findOneAndUpdate(
      { userId: userDoc._id, role: emp.role },
      {
        userId: userDoc._id,
        role: emp.role,
        assignedBy: 'SYSTEM_SEED',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // 4. Pre-stage / link InstitutionIdentity
    await InstitutionIdentity.findOneAndUpdate(
      { loginId: emp.loginId },
      {
        loginId: emp.loginId,
        fullName: emp.fullName,
        email: emp.email,
        identityType: emp.profileType === PROFILE_TYPE.ADMIN ? 'ADMIN' : 'FACULTY',
        department: emp.department,
        status: 'ACTIVE',
        linkedUserUuid: userDoc.userUuid,
        linkedUserId: userDoc._id,
        linkedAt: new Date(),
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
      },
      { upsert: true, new: true }
    );

    userMap[emp.loginId] = userDoc;
  }

  return userMap;
}

module.exports = seedEmployees;

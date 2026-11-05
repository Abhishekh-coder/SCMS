const { describe, it } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');

const {
  UserSchema,
  RoleSchema,
  PermissionSchema,
  UserRoleSchema,
  StudentProfileSchema,
  FacultyProfileSchema,
  AdminProfileSchema
} = require('../../database/schema/schemas');

describe('Sprint 1 Identity & Access Management (IAM) Comprehensive Schema Tests', () => {

  describe('1. UserSchema Validation & Defaults', () => {
    const User = mongoose.model('TestUserComp', UserSchema);

    it('should pass validation with valid required fields and populate default values', () => {
      const user = new User({
        loginId: '2024-IT-A-059-STD',
        email: 'abhishek@campus.edu',
        passwordHash: '$2a$12$eImiTXuWVxfM37uY4JANjOL.8UTyh4G7w6z...6y',
        profileType: 'STUDENT'
      });

      const err = user.validateSync();
      assert.strictEqual(err, undefined);
      assert.strictEqual(user.tenantId, 'tenant_campus_01');
      assert.strictEqual(user.campusId, 'main_campus');
      assert.ok(['PENDING_ACTIVATION', 'PENDING_VERIFICATION'].includes(user.accountStatus));
      assert.strictEqual(user.emailVerified, false);
      assert.strictEqual(user.isDeleted, false);
      assert.strictEqual(user.deletedAt, null);
    });

    it('should fail validation when required fields are missing', () => {
      const user = new User({});
      const err = user.validateSync();
      assert.notStrictEqual(err, undefined);
      assert.ok(err.errors.loginId);
      assert.ok(err.errors.passwordHash);
      assert.ok(err.errors.profileType);
    });

    it('should fail validation on invalid email or profileType', () => {
      const user = new User({
        loginId: '2024-IT-A-059-STD',
        email: 'invalid-email-address',
        passwordHash: 'somehash',
        profileType: 'INVALID_PROFILE_TYPE'
      });

      const err = user.validateSync();
      assert.notStrictEqual(err, undefined);
      assert.ok(err.errors.email);
      assert.ok(err.errors.profileType);
    });

    it('should fail validation when accountStatus enum is invalid', () => {
      const user = new User({
        loginId: '2024-IT-A-059-STD',
        email: 'abhishek@campus.edu',
        passwordHash: 'hash',
        profileType: 'STUDENT',
        accountStatus: 'UNKNOWN_STATUS'
      });

      const err = user.validateSync();
      assert.notStrictEqual(err, undefined);
      assert.ok(err.errors.accountStatus);
    });
  });

  describe('2. Role & Permission Schemas', () => {
    const Role = mongoose.model('TestRoleComp', RoleSchema);
    const Permission = mongoose.model('TestPermissionComp', PermissionSchema);

    it('should compile PermissionSchema with valid module enum and code regex', () => {
      const perm = new Permission({
        code: 'complaint:create',
        module: 'complaints',
        description: 'Create new complaint'
      });
      assert.strictEqual(perm.validateSync(), undefined);

      const invalidPerm = new Permission({
        code: 'invalid code spaces!',
        module: 'invalid_module'
      });
      const err = invalidPerm.validateSync();
      assert.notStrictEqual(err, undefined);
      assert.ok(err.errors.code);
      assert.ok(err.errors.module);
    });

    it('should compile RoleSchema with uppercase code requirement', () => {
      const role = new Role({
        name: 'Department Head',
        code: 'DEPT_HEAD',
        permissions: ['complaint:read', 'complaint:assign']
      });
      assert.strictEqual(role.validateSync(), undefined);
      assert.strictEqual(role.code, 'DEPT_HEAD');
    });
  });

  describe('3. UserRole Junction Schema & Indexes', () => {
    const UserRole = mongoose.model('TestUserRoleComp', UserRoleSchema);

    it('should compile UserRole schema with required userId and roleId ObjectIds', () => {
      const userId = new mongoose.Types.ObjectId();
      const roleId = new mongoose.Types.ObjectId();

      const userRole = new UserRole({
        userId,
        roleId,
        assignedBy: 'SYSTEM_ADMIN'
      });

      assert.strictEqual(userRole.validateSync(), undefined);
      assert.strictEqual(userRole.assignedBy, 'SYSTEM_ADMIN');
    });
  });

  describe('4. StudentProfile, FacultyProfile, and AdminProfile Schemas', () => {
    const StudentProfile = mongoose.model('TestStudentProfileComp', StudentProfileSchema);
    const FacultyProfile = mongoose.model('TestFacultyProfileComp', FacultyProfileSchema);
    const AdminProfile = mongoose.model('TestAdminProfileComp', AdminProfileSchema);
    const dummyId = new mongoose.Types.ObjectId();

    it('should validate StudentProfile rollNo and department', () => {
      const student = new StudentProfile({
        userId: dummyId,
        loginId: '2024-IT-A-059-STD',
        admissionBatch: 2024,
        department: 'IT',
        division: 'A',
        rollNo: '059',
        fullName: 'Abhishek Sharma',
        semester: 6,
        hostelBlock: 'B-2',
        roomNumber: '401'
      });
      assert.strictEqual(student.validateSync(), undefined);

      const invalidStudent = new StudentProfile({
        userId: dummyId,
        loginId: '2024-IT-A-059-STD',
        semester: 12, // Exceeds max 10
      });
      const err = invalidStudent.validateSync();
      assert.notStrictEqual(err, undefined);
      assert.ok(err.errors.admissionBatch);
      assert.ok(err.errors.department);
      assert.ok(err.errors.semester);
    });

    it('should validate FacultyProfile employeeCode format and designation enum', () => {
      const faculty = new FacultyProfile({
        userId: dummyId,
        loginId: 'EMP-IT-0031',
        employeeCode: 'EMP-IT-0031',
        fullName: 'Dr. Ramesh Kumar',
        designation: 'PROFESSOR',
        department: 'IT'
      });
      assert.strictEqual(faculty.validateSync(), undefined);

      const invalidFaculty = new FacultyProfile({
        userId: dummyId,
        loginId: 'EMP-IT-0031',
        employeeCode: 'EMP-IT-0031',
        fullName: 'Dr. Ramesh Kumar',
        designation: 'INVALID_DESIGNATION', // Invalid enum
        department: 'IT'
      });
      const err = invalidFaculty.validateSync();
      assert.notStrictEqual(err, undefined);
      assert.ok(err.errors.designation);
    });

    it('should validate AdminProfile required fields and schema', () => {
      const admin = new AdminProfile({
        userId: dummyId,
        loginId: 'ADM-0001',
        fullName: 'System Administrator',
        office: 'Main Administrative Block'
      });
      assert.strictEqual(admin.validateSync(), undefined);

      const invalidAdmin = new AdminProfile({
        userId: dummyId
      });
      const err = invalidAdmin.validateSync();
      assert.notStrictEqual(err, undefined);
      assert.ok(err.errors.loginId);
      assert.ok(err.errors.fullName);
    });
  });
});

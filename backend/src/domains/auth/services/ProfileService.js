const mongoose = require('mongoose');
const {
  StudentProfileSchema,
  FacultyProfileSchema,
  AdminProfileSchema
} = require('../../../../../database/schema/schemas');
const { AppError } = require('../../../shared/errors/AppError');

const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile', FacultyProfileSchema);
const AdminProfile = mongoose.models.AdminProfile || mongoose.model('AdminProfile', AdminProfileSchema);

class ProfileService {
  async createProfile(user, role, profileDetails = {}, session = null) {
    const { _id: userId, userUuid, tenantId, campusId } = user;

    if (role === 'STUDENT') {
      const { rollNumber, semester, branch, hostelBlock, roomNumber, division, admissionBatch } = profileDetails;
      const isAutoRoll = !rollNumber && !profileDetails.rollNo;
      let roll = (rollNumber || profileDetails.rollNo || `STD-${Math.floor(100000 + Math.random() * 900000)}`).toUpperCase().trim();
      const dept = (branch || profileDetails.department || 'GENERAL').toUpperCase().trim();

      let existingRoll = await StudentProfile.findOne({
        $or: [{ rollNo: roll }, { rollNumber: roll }]
      }).session(session);

      if (existingRoll) {
        if (isAutoRoll) {
          roll = `STD-${Math.floor(100000 + Math.random() * 900000)}`;
        } else {
          throw new AppError(`Roll number ${roll} is already registered.`, 409, 'AUTH_002');
        }
      }

      const resolvedDivision = (division || 'A').toUpperCase().trim();
      const resolvedBatch = admissionBatch ? Number(admissionBatch) : new Date().getFullYear();
      const resolvedFullName = user.fullName || profileDetails.fullName || 'Student User';
      const resolvedLoginId = user.loginId || `${resolvedBatch}-${dept}-${resolvedDivision}-${roll}-STD`;

      const studentProfile = new StudentProfile({
        tenantId,
        campusId,
        userId,
        userUuid,
        loginId: resolvedLoginId,
        admissionBatch: resolvedBatch,
        department: dept,
        division: resolvedDivision,
        rollNo: roll,
        rollNumber: roll,
        branch: dept,
        fullName: resolvedFullName,
        semester: semester ? Number(semester) : 1,
        hostelBlock: hostelBlock ? hostelBlock.trim() : null,
        roomNumber: roomNumber ? roomNumber.trim() : null
      });

      return await studentProfile.save({ session });
    }

    if (role === 'FACULTY') {
      const { employeeId, designation, departmentId, isClassIncharge, isTeacherGuardian, isHod, isDean } = profileDetails;
      const isAutoEmp = !employeeId && !profileDetails.employeeCode;
      let empCode = (employeeId || profileDetails.employeeCode || `EMP-${Math.floor(100000 + Math.random() * 900000)}`).toUpperCase().trim();
      const dept = (departmentId || profileDetails.department || 'GENERAL').toUpperCase().trim();
      const desig = (designation || profileDetails.designation || 'ASSISTANT_PROFESSOR').toUpperCase().trim();

      let existingEmp = await FacultyProfile.findOne({
        $or: [{ employeeCode: empCode }, { employeeId: empCode }]
      }).session(session);

      if (existingEmp) {
        if (isAutoEmp) {
          empCode = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
        } else {
          throw new AppError(`Employee ID ${empCode} is already registered.`, 409, 'AUTH_002');
        }
      }

      const resolvedFullName = user.fullName || profileDetails.fullName || 'Faculty Member';
      const resolvedLoginId = user.loginId || `EMP-${dept}-${empCode}`;

      const facultyProfile = new FacultyProfile({
        tenantId,
        campusId,
        userId,
        userUuid,
        loginId: resolvedLoginId,
        employeeCode: empCode,
        employeeId: empCode,
        department: dept,
        departmentId: dept,
        fullName: resolvedFullName,
        designation: desig,
        isClassIncharge: !!isClassIncharge,
        isTeacherGuardian: !!isTeacherGuardian,
        isHod: !!isHod,
        isDean: !!isDean
      });

      return await facultyProfile.save({ session });
    }

    if (role === 'ADMIN') {
      const { adminLevel, managedDepartments } = profileDetails;
      const resolvedFullName = user.fullName || profileDetails.fullName || 'Admin User';
      const resolvedLoginId = user.loginId || `ADM-${Date.now()}`;

      const adminProfile = new AdminProfile({
        tenantId,
        campusId,
        userId,
        userUuid,
        loginId: resolvedLoginId,
        fullName: resolvedFullName,
        adminLevel: adminLevel ? adminLevel.toUpperCase().trim() : 'DEPARTMENT_ADMIN',
        managedDepartments: Array.isArray(managedDepartments) ? managedDepartments : []
      });

      return await adminProfile.save({ session });
    }

    throw new AppError(`Unsupported user profile role '${role}'.`, 400, 'VAL_001');
  }

  async deleteProfileByUserId(userId, role, session = null) {
    if (role === 'STUDENT') {
      await StudentProfile.deleteOne({ userId }).session(session);
    } else if (role === 'FACULTY') {
      await FacultyProfile.deleteOne({ userId }).session(session);
    } else if (role === 'ADMIN') {
      await AdminProfile.deleteOne({ userId }).session(session);
    }
  }
}

module.exports = new ProfileService();

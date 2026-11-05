const { AppError } = require('../shared/errors/AppError');

const DEAN_AUTHORIZED_DEPTS = ['IT', 'CE', 'EXTC', 'ACADEMIC', 'CS'];

/**
 * Validates role-based and department-level organizational scope for complaint access.
 * Throws 403 AppError if access is denied.
 * 
 * Boundary rules:
 * - SUPER_ADMIN / PRINCIPAL: Apex institution-wide oversight.
 * - DEAN: Multi-department academic oversight within authorized departments.
 * - HOD: Strictly isolated to own department.
 * - FACULTY / CLASS_INCHARGE / TEACHER_GUARDIAN: Strictly isolated to own department & assigned cases.
 * - CAMPUS_SERVICES / FACILITIES / TECHNICIAN: Strictly isolated to CAMPUS_SERVICES & assigned work orders.
 * - GUARDIAN: Strictly isolated to linked student complaints.
 * - STUDENT: Strictly isolated to own submitted complaints (IDOR protection).
 */
function assertComplaintAccess(actorUser, complaint, actionType = 'READ') {
  if (!actorUser) {
    throw new AppError('Authentication required.', 401, 'UNAUTHENTICATED');
  }

  if (!complaint) {
    throw new AppError('Complaint not found.', 404, 'NOT_FOUND');
  }

  const userUuid = actorUser.userUuid;
  const roles = actorUser.roles || (actorUser.primaryRole ? [actorUser.primaryRole] : ['STUDENT']);
  const primaryRole = actorUser.primaryRole || roles[0] || 'STUDENT';
  const userDept = (actorUser.departmentCode || actorUser.department || '').toUpperCase().trim();
  const complaintDept = (complaint.departmentCode || '').toUpperCase().trim();

  // Multi-Tenancy Check
  if (actorUser.tenantId && complaint.tenantId && actorUser.tenantId !== complaint.tenantId) {
    throw new AppError('Access forbidden: Cross-tenant access denied.', 403, 'TENANT_MISMATCH');
  }

  // 1. Apex Institutional Administration (Principal / Super Admin)
  if (roles.includes('SUPER_ADMIN') || roles.includes('PRINCIPAL') || primaryRole === 'PRINCIPAL') {
    return true; // Institutional oversight
  }

  // 2. Dean Scope (Multi-department academic oversight)
  if (roles.includes('DEAN') || primaryRole === 'DEAN') {
    if (DEAN_AUTHORIZED_DEPTS.includes(complaintDept) || complaint.assignedToUserUuid === userUuid) {
      return true;
    }
    throw new AppError('Access forbidden: Complaint is outside Dean authorized academic departments.', 403, 'FORBIDDEN', { subCode: 'FORBIDDEN_SCOPE' });
  }

  // 3. Head of Department (HOD) - Strict department data isolation
  if (roles.includes('HOD') || primaryRole === 'HOD') {
    if (userDept && complaintDept && userDept === complaintDept) {
      return true;
    }
    if (complaint.assignedToUserUuid === userUuid) {
      return true;
    }
    throw new AppError(`Access forbidden: HOD cannot access complaints from '${complaintDept}' department.`, 403, 'FORBIDDEN', { subCode: 'FORBIDDEN_DEPARTMENT' });
  }

  // 4. Maintenance / Facilities Staff
  if (roles.includes('CAMPUS_SERVICES_HEAD') || roles.includes('MAINTENANCE_STAFF') || roles.includes('FACILITIES') || roles.includes('TECHNICIAN') || primaryRole === 'CAMPUS_SERVICES_HEAD') {
    const isAssignedTech = complaint.technicianAssignment?.technicianUserUuid === userUuid;
    const isAssignedHandler = complaint.assignedToUserUuid === userUuid;
    if (complaintDept === 'CAMPUS_SERVICES' || isAssignedTech || isAssignedHandler) {
      return true;
    }
    throw new AppError('Access forbidden: Facilities staff can only access Campus Services and assigned work orders.', 403, 'FORBIDDEN', { subCode: 'FORBIDDEN_FACILITIES' });
  }

  // 5. Faculty / Class Incharge / Teacher Guardian / Department Coordinator
  if (roles.some(r => ['FACULTY', 'CLASS_INCHARGE', 'TEACHER_GUARDIAN', 'DEPT_COORDINATOR'].includes(r))) {
    const isAssignedHandler = complaint.assignedToUserUuid === userUuid || (complaint.assignedUserUuids && complaint.assignedUserUuids.includes(userUuid));
    const isCreator = complaint.createdByUserUuid === userUuid;
    
    // Must belong to the same department
    if (userDept && complaintDept && userDept !== complaintDept && !isAssignedHandler && !isCreator) {
      throw new AppError(`Access forbidden: Faculty cannot access complaints outside ${userDept} department.`, 403, 'FORBIDDEN', { subCode: 'FORBIDDEN_DEPARTMENT' });
    }
    return true;
  }

  // 6. Guardian / Parent
  if (roles.includes('GUARDIAN') || roles.includes('PARENT') || primaryRole === 'GUARDIAN') {
    const linkedStudentUuid = actorUser.linkedStudentUuid;
    if (linkedStudentUuid && complaint.createdByUserUuid === linkedStudentUuid) {
      return true;
    }
    throw new AppError('Access forbidden: Guardians can only access their linked student records.', 403, 'FORBIDDEN', { subCode: 'FORBIDDEN_GUARDIAN' });
  }

  // 7. Student Ownership Isolation (IDOR Protection)
  if (roles.includes('STUDENT') || primaryRole === 'STUDENT') {
    if (complaint.createdByUserUuid === userUuid) {
      return true;
    }
    throw new AppError('Access forbidden: You do not have permission to access another student\'s complaint.', 403, 'FORBIDDEN', { subCode: 'FORBIDDEN_STUDENT_IDOR' });
  }

  // 8. General Admin / System Staff
  if (roles.includes('ADMIN') || roles.includes('ADMIN_STAFF')) {
    if (complaintDept === 'CAMPUS_SERVICES' || (userDept && userDept === complaintDept)) {
      return true;
    }
    throw new AppError('Access forbidden: Administrative staff restricted to authorized departmental scope.', 403, 'FORBIDDEN', { subCode: 'FORBIDDEN_ADMIN_SCOPE' });
  }

  // Fallback: Check direct ownership or assignment
  if (complaint.createdByUserUuid === userUuid || complaint.assignedToUserUuid === userUuid) {
    return true;
  }

  throw new AppError('Access forbidden: You do not have permission to access this complaint.', 403, 'FORBIDDEN');
}

module.exports = {
  assertComplaintAccess,
  DEAN_AUTHORIZED_DEPTS
};

const { ROLES, ASSIGNMENT_TYPES } = require('../../../shared/constants/roles');

const ROLE_ROUTES = {
  [ROLES.STUDENT]: '/workspace/student',
  [ROLES.FACULTY]: '/workspace/faculty',
  [ROLES.HOD]: '/workspace/hod',
  [ROLES.DEAN]: '/workspace/dean',
  [ROLES.PRINCIPAL]: '/workspace/principal',
  [ROLES.ADMIN]: '/workspace/admin',
  [ROLES.SUPER_ADMIN]: '/workspace/admin',
  [ASSIGNMENT_TYPES.CLASS_INCHARGE]: '/workspace/class-incharge',
  [ASSIGNMENT_TYPES.TEACHER_GUARDIAN]: '/workspace/teacher-guardian',
  [ASSIGNMENT_TYPES.LAB_INCHARGE]: '/workspace/faculty',
  [ASSIGNMENT_TYPES.HOD]: '/workspace/hod',
  [ASSIGNMENT_TYPES.DEAN]: '/workspace/dean',
  [ASSIGNMENT_TYPES.PRINCIPAL]: '/workspace/principal',
};

const EXECUTIVE_PRIORITY = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.PRINCIPAL,
  ROLES.DEAN,
  ROLES.HOD,
];

/**
 * Resolves post-login workspace destination from roles, profile type, and assignments.
 *
 * Rules (frozen):
 * - Student → student dashboard (never workspace selection)
 * - Executive roles (Admin, Principal, Dean, HOD) → direct dashboard
 * - Multiple active assignments (>1) → workspace selection
 * - Single assignment → direct to that assignment workspace
 * - Base faculty (FACULTY role, no assignments) → faculty dashboard
 * - Employee with no role path and no assignments → no workspace (error state)
 */
function resolveWorkspaceRedirect({ roles = [], profileType, assignments = [] }) {
  const activeAssignments = assignments.filter(a => a.isActive !== false);
  const roleSet = new Set(roles);

  if (roleSet.has(ROLES.STUDENT) || profileType === 'STUDENT') {
    return {
      needsWorkspaceSelection: false,
      noWorkspace: false,
      activeRole: ROLES.STUDENT,
      redirectTo: ROLE_ROUTES[ROLES.STUDENT],
      defaultWorkspace: { role: ROLES.STUDENT, route: ROLE_ROUTES[ROLES.STUDENT] },
    };
  }

  for (const execRole of EXECUTIVE_PRIORITY) {
    if (roleSet.has(execRole)) {
      return {
        needsWorkspaceSelection: false,
        noWorkspace: false,
        activeRole: execRole,
        redirectTo: ROLE_ROUTES[execRole],
        defaultWorkspace: { role: execRole, route: ROLE_ROUTES[execRole] },
      };
    }
  }

  if (activeAssignments.length > 1) {
    return {
      needsWorkspaceSelection: true,
      noWorkspace: false,
      activeRole: null,
      redirectTo: '/select-workspace',
      defaultWorkspace: null,
    };
  }

  if (activeAssignments.length === 1) {
    const assignmentType = activeAssignments[0].assignmentType;
    const route = ROLE_ROUTES[assignmentType] || ROLE_ROUTES[ROLES.FACULTY];
    return {
      needsWorkspaceSelection: false,
      noWorkspace: false,
      activeRole: assignmentType,
      redirectTo: route,
      defaultWorkspace: {
        role: assignmentType,
        route,
        assignment: activeAssignments[0],
      },
    };
  }

  if (roleSet.has(ROLES.FACULTY)) {
    return {
      needsWorkspaceSelection: false,
      noWorkspace: false,
      activeRole: ROLES.FACULTY,
      redirectTo: ROLE_ROUTES[ROLES.FACULTY],
      defaultWorkspace: { role: ROLES.FACULTY, route: ROLE_ROUTES[ROLES.FACULTY] },
    };
  }

  if (profileType === 'FACULTY') {
    return {
      needsWorkspaceSelection: false,
      noWorkspace: true,
      activeRole: null,
      redirectTo: '/select-workspace',
      defaultWorkspace: null,
    };
  }

  return {
    needsWorkspaceSelection: false,
    noWorkspace: true,
    activeRole: null,
    redirectTo: '/select-workspace',
    defaultWorkspace: null,
  };
}

module.exports = { resolveWorkspaceRedirect, ROLE_ROUTES };

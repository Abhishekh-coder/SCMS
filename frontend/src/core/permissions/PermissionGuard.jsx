import React from 'react';
import { useWorkspaceBootstrap } from '../workspace/useWorkspaceBootstrap.jsx';

export function usePermissions() {
  const { permissions, roles, assignments } = useWorkspaceBootstrap();

  const hasPermission = (requiredPermission) => {
    if (!requiredPermission) return true;
    if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) return true;
    return permissions.includes(requiredPermission);
  };

  const hasRole = (...allowedRoles) => {
    return roles.some(r => allowedRoles.includes(r));
  };

  const hasAssignment = (assignmentType) => {
    return assignments.some(a => a.assignmentType === assignmentType);
  };

  return { permissions, roles, assignments, hasPermission, hasRole, hasAssignment };
}

export function PermissionGuard({ requiredPermission, allowedRoles, fallback = null, children }) {
  const { hasPermission, hasRole } = usePermissions();

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return fallback;
  }

  return <>{children}</>;
}

export default PermissionGuard;

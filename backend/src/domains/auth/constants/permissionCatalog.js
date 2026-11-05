const PERMISSION_CATALOG = {
  // Complaint Domain Permissions (Resource:Action)
  COMPLAINT_CREATE: { code: 'complaint:create', module: 'complaints', description: 'Create a new complaint' },
  COMPLAINT_VIEW_OWN: { code: 'complaint:view_own', module: 'complaints', description: 'View complaints created by self' },
  COMPLAINT_VIEW_DEPT: { code: 'complaint:view_department', module: 'complaints', description: 'View complaints assigned to own department' },
  COMPLAINT_ASSIGN: { code: 'complaint:assign', module: 'complaints', description: 'Assign complaint to faculty or department handler' },
  COMPLAINT_ESCALATE: { code: 'complaint:escalate', module: 'complaints', description: 'Escalate unresolved complaint to higher authority' },
  COMPLAINT_RESOLVE: { code: 'complaint:resolve', module: 'complaints', description: 'Resolve assigned complaint' },
  COMPLAINT_REOPEN: { code: 'complaint:reopen', module: 'complaints', description: 'Reopen a resolved complaint' },
  COMPLAINT_CLOSE: { code: 'complaint:close', module: 'complaints', description: 'Close complaint after verification' },
  COMPLAINT_DELETE: { code: 'complaint:delete', module: 'complaints', description: 'Soft delete complaint' },

  // Analytics & Power BI Permissions
  ANALYTICS_VIEW: { code: 'analytics:view', module: 'analytics', description: 'Access Power BI analytics and reporting dashboards' },

  // User & Administrative Governance Permissions
  USER_MANAGE: { code: 'user:manage', module: 'users', description: 'Manage user profiles and account statuses' },
  ROLE_ASSIGN: { code: 'role:assign', module: 'auth', description: 'Assign or revoke user system roles' },
  WORKFLOW_CONFIGURE: { code: 'workflow:configure', module: 'workflow', description: 'Configure complaint workflow state transitions and SLA timers' }
};

module.exports = PERMISSION_CATALOG;

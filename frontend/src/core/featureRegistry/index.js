/**
 * CCMS Feature Registry v1.2
 * Central catalog of features, icons, routes, permissions, and available widgets.
 */

export const FEATURE_REGISTRY = {
  COMPLAINTS_STUDENT: {
    id: 'complaints_student',
    module: 'complaints',
    label: 'My Complaints',
    route: '/workspace/complaints/my',
    icon: 'FileText',
    requiredPermission: 'complaint:create',
    widgets: ['MY_COMPLAINTS_SUMMARY', 'QUICK_LODGE_WIDGET']
  },
  COMPLAINTS_ASSIGNED: {
    id: 'complaints_assigned',
    module: 'complaints',
    label: 'Assigned Queue',
    route: '/workspace/complaints/assigned',
    icon: 'Inbox',
    requiredPermission: 'complaint:view_assigned',
    widgets: ['ASSIGNED_COMPLAINTS_METRICS', 'SLA_BREACH_HEATMAP']
  },
  DEPT_ANALYTICS: {
    id: 'dept_analytics',
    module: 'analytics',
    label: 'Department Overview',
    route: '/workspace/analytics/department',
    icon: 'BarChart3',
    requiredPermission: 'analytics:view_dept',
    widgets: ['DEPARTMENT_WORKLOAD_DISTRIBUTION']
  },
  EXECUTIVE_ANALYTICS: {
    id: 'executive_analytics',
    module: 'analytics',
    label: 'Executive Insights',
    route: '/workspace/analytics/executive',
    icon: 'TrendingUp',
    requiredPermission: 'analytics:view_campus',
    widgets: ['POWER_BI_EXEC_FEED']
  },
  GOVERNANCE: {
    id: 'governance',
    module: 'governance',
    label: 'Master Data & Governance',
    route: '/workspace/admin/governance',
    icon: 'ShieldAlert',
    requiredPermission: 'governance:manage',
    widgets: ['SYSTEM_HEALTH_WIDGET', 'AUDIT_LOG_STREAM']
  }
};

export const getFeatureById = (id) => Object.values(FEATURE_REGISTRY).find(f => f.id === id);

export default FEATURE_REGISTRY;

import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Users,
  BarChart3,
  Settings,
  MapPin,
  HelpCircle,
  Bell,
  User,
  CheckSquare,
  Clock,
  AlertTriangle,
  Building2,
  Wrench,
  ShieldCheck,
  Layers,
  Activity,
  FileCheck,
  Compass,
  Inbox,
  Send,
  AlertCircle,
  ClipboardList
} from 'lucide-react';

/**
 * Centralized, permission-driven role navigation configuration.
 * Groups navigation items strictly into distinct semantic sections per persona.
 */
export const getNavigationSectionsForUser = (user, activeRole, unreadCount = 0) => {
  const role = user?.primaryRole || (user?.roles && user?.roles[0]) || activeRole || 'STUDENT';

  switch (role) {
    case 'STUDENT':
      return [
        {
          heading: 'STUDENT SPACE',
          items: [
            { key: 'DASHBOARD', label: 'Home Dashboard', icon: LayoutDashboard, path: '/workspace/student' },
            { key: 'REGISTER_COMPLAINT', label: 'Report Complaint', icon: PlusCircle, isAction: true },
            { key: 'MY_COMPLAINTS', label: 'My Complaints', icon: FileText, path: '/workspace/student/complaints' }
          ]
        },
        {
          heading: 'CAMPUS',
          items: [
            { key: 'CAMPUS_INFO', label: 'Campus Information', icon: Compass, path: '/dashboard/campus-info' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'HELP_SUPPORT', label: 'Help & Support', icon: HelpCircle, path: '/dashboard/help' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: User, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'CLASS_INCHARGE':
      return [
        {
          heading: 'CLASS MANAGEMENT',
          items: [
            { key: 'DASHBOARD', label: 'Class Dashboard', icon: LayoutDashboard, path: '/workspace/class-incharge' },
            { key: 'ASSIGNED_COMPLAINTS', label: 'Assigned Complaints', icon: FileText, path: '/workspace/class-incharge/assigned' },
            { key: 'CLASS_COMPLAINTS', label: 'Class Complaints', icon: ClipboardList, path: '/workspace/class-incharge/class-complaints' }
          ]
        },
        {
          heading: 'COORDINATION',
          items: [
            { key: 'FORWARDED_COMPLAINTS', label: 'Forwarded Complaints', icon: Send, path: '/workspace/class-incharge/forwarded' },
            { key: 'CLASS_OVERVIEW', label: 'Class Overview', icon: Users, path: '/workspace/class-incharge/overview' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: User, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'TEACHER_GUARDIAN':
      return [
        {
          heading: 'STUDENT SUPPORT',
          items: [
            { key: 'DASHBOARD', label: 'TG Dashboard', icon: LayoutDashboard, path: '/workspace/teacher-guardian' },
            { key: 'FORWARDED_COMPLAINTS', label: 'Forwarded Complaints', icon: Send, path: '/workspace/teacher-guardian/forwarded' },
            { key: 'STUDENT_CONCERNS', label: 'Student Concerns', icon: Inbox, path: '/workspace/teacher-guardian/concerns' }
          ]
        },
        {
          heading: 'FOLLOW-UP',
          items: [
            { key: 'PENDING_RESPONSES', label: 'Pending Responses', icon: Clock, path: '/workspace/teacher-guardian/pending' },
            { key: 'ESCALATED_COMPLAINTS', label: 'Escalated to HOD', icon: AlertTriangle, path: '/workspace/teacher-guardian/escalated' },
            { key: 'RESOLUTION_FOLLOWUP', label: 'Resolution Follow-up', icon: CheckSquare, path: '/workspace/teacher-guardian/followup' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: User, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'FACULTY':
      return [
        {
          heading: 'FACULTY WORKSPACE',
          items: [
            { key: 'DASHBOARD', label: 'Faculty Dashboard', icon: LayoutDashboard, path: '/workspace/faculty' },
            { key: 'ASSIGNED_COMPLAINTS', label: 'Assigned Complaints', icon: FileText, path: '/workspace/faculty/assigned' },
            { key: 'DEPT_TASKS', label: 'My Departmental Tasks', icon: ClipboardList, path: '/workspace/faculty/tasks' }
          ]
        },
        {
          heading: 'FOLLOW-UP',
          items: [
            { key: 'PENDING_ACTIONS', label: 'Pending Actions', icon: Clock, path: '/workspace/faculty/pending' },
            { key: 'RESOLUTION_UPDATES', label: 'Resolution Updates', icon: CheckSquare, path: '/workspace/faculty/updates' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: User, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'HOD':
      return [
        {
          heading: 'DEPARTMENT',
          items: [
            { key: 'DASHBOARD', label: 'Department Dashboard', icon: LayoutDashboard, path: '/workspace/hod' },
            { key: 'DEPARTMENT_COMPLAINTS', label: 'Department Complaints', icon: FileText, path: '/workspace/hod/complaints' }
          ]
        },
        {
          heading: 'RESOLUTION',
          items: [
            { key: 'PENDING_ASSIGNMENT', label: 'Pending Assignment', icon: Clock, path: '/workspace/hod/pending' },
            { key: 'ESCALATED_COMPLAINTS', label: 'Escalated Cases', icon: AlertTriangle, path: '/workspace/hod/escalated' },
            { key: 'RESOLUTION_MONITORING', label: 'Resolution Monitoring', icon: Activity, path: '/workspace/hod/monitoring' }
          ]
        },
        {
          heading: 'PEOPLE',
          items: [
            { key: 'FACULTY_STAFF', label: 'Faculty & Staff', icon: Users, path: '/workspace/hod/faculty' },
            { key: 'DEPARTMENT_OVERVIEW', label: 'Department Overview', icon: Building2, path: '/workspace/hod/overview' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: User, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'DEAN':
      return [
        {
          heading: 'ACADEMIC GOVERNANCE',
          items: [
            { key: 'DASHBOARD', label: 'Dean Dashboard', icon: LayoutDashboard, path: '/workspace/dean' },
            { key: 'ALL_DEPARTMENTS', label: 'All Departments', icon: Building2, path: '/workspace/dean/departments' }
          ]
        },
        {
          heading: 'INSTITUTIONAL COORDINATION',
          items: [
            { key: 'CRITICAL_ESCALATIONS', label: 'Cross-Department Escalations', icon: AlertTriangle, path: '/workspace/dean/escalations' },
            { key: 'DEPT_PERFORMANCE', label: 'Department Performance', icon: BarChart3, path: '/workspace/dean/performance' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'MY_REQUESTS', label: 'My Requests / Complaints', icon: FileText, path: '/workspace/dean/my-requests' },
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: User, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'PRINCIPAL':
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return [
        {
          heading: 'INSTITUTIONAL COMMAND',
          items: [
            { key: 'COMMAND_CENTER', label: 'Campus Command Center', icon: ShieldCheck, path: '/dashboard' }
          ]
        },
        {
          heading: 'GOVERNANCE',
          items: [
            { key: 'CRITICAL_ESCALATIONS', label: 'Critical Escalations', icon: AlertTriangle, path: '/dashboard/critical-escalations' },
            { key: 'INSTITUTIONAL_DECISIONS', label: 'Institutional Decisions', icon: FileCheck, path: '/dashboard/decisions' }
          ]
        },
        {
          heading: 'OVERSIGHT',
          items: [
            { key: 'DEPT_PERFORMANCE', label: 'Department Performance', icon: BarChart3, path: '/dashboard/performance' },
            { key: 'AUDIT_ACTIVITY', label: 'Audit & Activity', icon: Activity, path: '/dashboard/audit' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: User, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'CAMPUS_SERVICES_HEAD':
    case 'MAINTENANCE':
    case 'FACILITIES_STAFF':
      return [
        {
          heading: 'OPERATIONS',
          items: [
            { key: 'DASHBOARD', label: 'Operations Dashboard', icon: LayoutDashboard, path: '/workspace/campus-services' },
            { key: 'ASSIGNED_WORK_ORDERS', label: 'Assigned Work Orders', icon: Wrench, path: '/workspace/campus-services/assigned' }
          ]
        },
        {
          heading: 'SERVICE MANAGEMENT',
          items: [
            { key: 'NEW_REQUESTS', label: 'New Requests', icon: Inbox, path: '/workspace/campus-services/new' },
            { key: 'IN_PROGRESS_ORDERS', label: 'In Progress', icon: Clock, path: '/workspace/campus-services/in-progress' },
            { key: 'RESOLVED_ORDERS', label: 'Resolved', icon: CheckSquare, path: '/workspace/campus-services/resolved' }
          ]
        },
        {
          heading: 'CAMPUS',
          items: [
            { key: 'ASSIGNED_BUILDINGS', label: 'Assigned Buildings', icon: MapPin, path: '/workspace/campus-services/buildings' },
            { key: 'FACILITY_INFO', label: 'Facility Information', icon: Compass, path: '/workspace/campus-services/facilities' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: User, path: '/dashboard/profile' }
          ]
        }
      ];

    default:
      return [
        {
          heading: 'USER SPACE',
          items: [
            { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: User, path: '/dashboard/profile' }
          ]
        }
      ];
  }
};

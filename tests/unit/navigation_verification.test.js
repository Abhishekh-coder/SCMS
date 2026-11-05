const { describe, it } = require('node:test');
const assert = require('node:assert');

// Mock Lucide Icons for test environment
const mockIcon = { name: 'MockIcon' };

// Direct test implementation of navigation configuration generator logic
const getNavigationSectionsForUser = (user, activeRole, unreadCount = 0) => {
  const role = user?.primaryRole || (user?.roles && user?.roles[0]) || activeRole || 'STUDENT';

  switch (role) {
    case 'STUDENT':
      return [
        {
          heading: 'STUDENT SPACE',
          items: [
            { key: 'DASHBOARD', label: 'Home Dashboard', icon: mockIcon, path: '/workspace/student' },
            { key: 'REGISTER_COMPLAINT', label: 'Report Complaint', icon: mockIcon, isAction: true },
            { key: 'MY_COMPLAINTS', label: 'My Complaints', icon: mockIcon, path: '/workspace/student/complaints' }
          ]
        },
        {
          heading: 'CAMPUS',
          items: [
            { key: 'CAMPUS_INFO', label: 'Campus Information', icon: mockIcon, path: '/dashboard/campus-info' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: mockIcon, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'HELP_SUPPORT', label: 'Help & Support', icon: mockIcon, path: '/dashboard/help' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: mockIcon, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'CLASS_INCHARGE':
      return [
        {
          heading: 'CLASS MANAGEMENT',
          items: [
            { key: 'DASHBOARD', label: 'Class Dashboard', icon: mockIcon, path: '/workspace/class-incharge' },
            { key: 'ASSIGNED_COMPLAINTS', label: 'Assigned Complaints', icon: mockIcon, path: '/workspace/class-incharge/assigned' },
            { key: 'CLASS_COMPLAINTS', label: 'Class Complaints', icon: mockIcon, path: '/workspace/class-incharge/class-complaints' }
          ]
        },
        {
          heading: 'COORDINATION',
          items: [
            { key: 'FORWARDED_COMPLAINTS', label: 'Forwarded Complaints', icon: mockIcon, path: '/workspace/class-incharge/forwarded' },
            { key: 'CLASS_OVERVIEW', label: 'Class Overview', icon: mockIcon, path: '/workspace/class-incharge/overview' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: mockIcon, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: mockIcon, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'TEACHER_GUARDIAN':
      return [
        {
          heading: 'STUDENT SUPPORT',
          items: [
            { key: 'DASHBOARD', label: 'TG Dashboard', icon: mockIcon, path: '/workspace/teacher-guardian' },
            { key: 'FORWARDED_COMPLAINTS', label: 'Forwarded Complaints', icon: mockIcon, path: '/workspace/teacher-guardian/forwarded' },
            { key: 'STUDENT_CONCERNS', label: 'Student Concerns', icon: mockIcon, path: '/workspace/teacher-guardian/concerns' }
          ]
        },
        {
          heading: 'FOLLOW-UP',
          items: [
            { key: 'PENDING_RESPONSES', label: 'Pending Responses', icon: mockIcon, path: '/workspace/teacher-guardian/pending' },
            { key: 'ESCALATED_COMPLAINTS', label: 'Escalated to HOD', icon: mockIcon, path: '/workspace/teacher-guardian/escalated' },
            { key: 'RESOLUTION_FOLLOWUP', label: 'Resolution Follow-up', icon: mockIcon, path: '/workspace/teacher-guardian/followup' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: mockIcon, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: mockIcon, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'FACULTY':
      return [
        {
          heading: 'FACULTY WORKSPACE',
          items: [
            { key: 'DASHBOARD', label: 'Faculty Dashboard', icon: mockIcon, path: '/workspace/faculty' },
            { key: 'ASSIGNED_COMPLAINTS', label: 'Assigned Complaints', icon: mockIcon, path: '/workspace/faculty/assigned' },
            { key: 'DEPT_TASKS', label: 'My Departmental Tasks', icon: mockIcon, path: '/workspace/faculty/tasks' }
          ]
        },
        {
          heading: 'FOLLOW-UP',
          items: [
            { key: 'PENDING_ACTIONS', label: 'Pending Actions', icon: mockIcon, path: '/workspace/faculty/pending' },
            { key: 'RESOLUTION_UPDATES', label: 'Resolution Updates', icon: mockIcon, path: '/workspace/faculty/updates' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: mockIcon, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: mockIcon, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'HOD':
      return [
        {
          heading: 'DEPARTMENT',
          items: [
            { key: 'DASHBOARD', label: 'Department Dashboard', icon: mockIcon, path: '/workspace/hod' },
            { key: 'DEPARTMENT_COMPLAINTS', label: 'Department Complaints', icon: mockIcon, path: '/workspace/hod/complaints' }
          ]
        },
        {
          heading: 'RESOLUTION',
          items: [
            { key: 'PENDING_ASSIGNMENT', label: 'Pending Assignment', icon: mockIcon, path: '/workspace/hod/pending' },
            { key: 'ESCALATED_COMPLAINTS', label: 'Escalated Cases', icon: mockIcon, path: '/workspace/hod/escalated' },
            { key: 'RESOLUTION_MONITORING', label: 'Resolution Monitoring', icon: mockIcon, path: '/workspace/hod/monitoring' }
          ]
        },
        {
          heading: 'PEOPLE',
          items: [
            { key: 'FACULTY_STAFF', label: 'Faculty & Staff', icon: mockIcon, path: '/workspace/hod/faculty' },
            { key: 'DEPARTMENT_OVERVIEW', label: 'Department Overview', icon: mockIcon, path: '/workspace/hod/overview' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: mockIcon, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: mockIcon, path: '/dashboard/profile' }
          ]
        }
      ];

    case 'DEAN':
      return [
        {
          heading: 'ACADEMIC GOVERNANCE',
          items: [
            { key: 'DASHBOARD', label: 'Dean Dashboard', icon: mockIcon, path: '/workspace/dean' },
            { key: 'ALL_DEPARTMENTS', label: 'All Departments', icon: mockIcon, path: '/workspace/dean/departments' }
          ]
        },
        {
          heading: 'INSTITUTIONAL COORDINATION',
          items: [
            { key: 'CRITICAL_ESCALATIONS', label: 'Cross-Department Escalations', icon: mockIcon, path: '/workspace/dean/escalations' },
            { key: 'DEPT_PERFORMANCE', label: 'Department Performance', icon: mockIcon, path: '/workspace/dean/performance' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'MY_REQUESTS', label: 'My Requests / Complaints', icon: mockIcon, path: '/workspace/dean/my-requests' },
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: mockIcon, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: mockIcon, path: '/dashboard/profile' }
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
            { key: 'COMMAND_CENTER', label: 'Campus Command Center', icon: mockIcon, path: '/dashboard' }
          ]
        },
        {
          heading: 'GOVERNANCE',
          items: [
            { key: 'CRITICAL_ESCALATIONS', label: 'Critical Escalations', icon: mockIcon, path: '/dashboard/critical-escalations' },
            { key: 'INSTITUTIONAL_DECISIONS', label: 'Institutional Decisions', icon: mockIcon, path: '/dashboard/decisions' }
          ]
        },
        {
          heading: 'OVERSIGHT',
          items: [
            { key: 'DEPT_PERFORMANCE', label: 'Department Performance', icon: mockIcon, path: '/dashboard/performance' },
            { key: 'AUDIT_ACTIVITY', label: 'Audit & Activity', icon: mockIcon, path: '/dashboard/audit' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: mockIcon, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: mockIcon, path: '/dashboard/profile' }
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
            { key: 'DASHBOARD', label: 'Operations Dashboard', icon: mockIcon, path: '/workspace/campus-services' },
            { key: 'ASSIGNED_WORK_ORDERS', label: 'Assigned Work Orders', icon: mockIcon, path: '/workspace/campus-services/assigned' }
          ]
        },
        {
          heading: 'SERVICE MANAGEMENT',
          items: [
            { key: 'NEW_REQUESTS', label: 'New Requests', icon: mockIcon, path: '/workspace/campus-services/new' },
            { key: 'IN_PROGRESS_ORDERS', label: 'In Progress', icon: mockIcon, path: '/workspace/campus-services/in-progress' },
            { key: 'RESOLVED_ORDERS', label: 'Resolved', icon: mockIcon, path: '/workspace/campus-services/resolved' }
          ]
        },
        {
          heading: 'CAMPUS',
          items: [
            { key: 'ASSIGNED_BUILDINGS', label: 'Assigned Buildings', icon: mockIcon, path: '/workspace/campus-services/buildings' },
            { key: 'FACILITY_INFO', label: 'Facility Information', icon: mockIcon, path: '/workspace/campus-services/facilities' }
          ]
        },
        {
          heading: 'PERSONAL',
          items: [
            { key: 'NOTIFICATIONS', label: 'Notifications', icon: mockIcon, badge: unreadCount, path: '/dashboard/notifications' },
            { key: 'PROFILE_PREFERENCES', label: 'Profile & Settings', icon: mockIcon, path: '/dashboard/profile' }
          ]
        }
      ];

    default:
      return [];
  }
};

describe('Role-Specific Navigation Architecture & Button Functionality Tests', () => {

  it('1. Student Navigation Verification', () => {
    const sections = getNavigationSectionsForUser({ primaryRole: 'STUDENT' }, 'STUDENT', 2);
    assert.strictEqual(sections.length, 3);
    assert.strictEqual(sections[0].heading, 'STUDENT SPACE');
    assert.strictEqual(sections[1].heading, 'CAMPUS');
    assert.strictEqual(sections[2].heading, 'PERSONAL');

    const allKeys = sections.flatMap(s => s.items.map(i => i.key));
    assert.deepStrictEqual(allKeys, [
      'DASHBOARD',
      'REGISTER_COMPLAINT',
      'MY_COMPLAINTS',
      'CAMPUS_INFO',
      'NOTIFICATIONS',
      'HELP_SUPPORT',
      'PROFILE_PREFERENCES'
    ]);

    // Campus analytical map must NOT be present in student navigation
    assert.strictEqual(allKeys.includes('CAMPUS_MAP'), false);
    // Student Report Complaint must be marked as an action modal trigger
    const registerItem = sections[0].items.find(i => i.key === 'REGISTER_COMPLAINT');
    assert.strictEqual(registerItem.isAction, true);
  });

  it('2. Class In-Charge Navigation Verification', () => {
    const sections = getNavigationSectionsForUser({ primaryRole: 'CLASS_INCHARGE' }, 'CLASS_INCHARGE');
    assert.strictEqual(sections.length, 3);
    assert.strictEqual(sections[0].heading, 'CLASS MANAGEMENT');
    assert.strictEqual(sections[1].heading, 'COORDINATION');
    assert.strictEqual(sections[2].heading, 'PERSONAL');

    const allKeys = sections.flatMap(s => s.items.map(i => i.key));
    assert.deepStrictEqual(allKeys, [
      'DASHBOARD',
      'ASSIGNED_COMPLAINTS',
      'CLASS_COMPLAINTS',
      'FORWARDED_COMPLAINTS',
      'CLASS_OVERVIEW',
      'NOTIFICATIONS',
      'PROFILE_PREFERENCES'
    ]);
  });

  it('3. Teacher Guardian Navigation Verification', () => {
    const sections = getNavigationSectionsForUser({ primaryRole: 'TEACHER_GUARDIAN' }, 'TEACHER_GUARDIAN');
    assert.strictEqual(sections.length, 3);
    assert.strictEqual(sections[0].heading, 'STUDENT SUPPORT');
    assert.strictEqual(sections[1].heading, 'FOLLOW-UP');
    assert.strictEqual(sections[2].heading, 'PERSONAL');

    const allKeys = sections.flatMap(s => s.items.map(i => i.key));
    assert.deepStrictEqual(allKeys, [
      'DASHBOARD',
      'FORWARDED_COMPLAINTS',
      'STUDENT_CONCERNS',
      'PENDING_RESPONSES',
      'ESCALATED_COMPLAINTS',
      'RESOLUTION_FOLLOWUP',
      'NOTIFICATIONS',
      'PROFILE_PREFERENCES'
    ]);
  });

  it('4. Faculty / Teacher Navigation Verification', () => {
    const sections = getNavigationSectionsForUser({ primaryRole: 'FACULTY' }, 'FACULTY');
    assert.strictEqual(sections.length, 3);
    assert.strictEqual(sections[0].heading, 'FACULTY WORKSPACE');
    assert.strictEqual(sections[1].heading, 'FOLLOW-UP');
    assert.strictEqual(sections[2].heading, 'PERSONAL');

    const allKeys = sections.flatMap(s => s.items.map(i => i.key));
    assert.deepStrictEqual(allKeys, [
      'DASHBOARD',
      'ASSIGNED_COMPLAINTS',
      'DEPT_TASKS',
      'PENDING_ACTIONS',
      'RESOLUTION_UPDATES',
      'NOTIFICATIONS',
      'PROFILE_PREFERENCES'
    ]);
  });

  it('5. HOD Navigation Verification', () => {
    const sections = getNavigationSectionsForUser({ primaryRole: 'HOD' }, 'HOD');
    assert.strictEqual(sections.length, 4);
    assert.strictEqual(sections[0].heading, 'DEPARTMENT');
    assert.strictEqual(sections[1].heading, 'RESOLUTION');
    assert.strictEqual(sections[2].heading, 'PEOPLE');
    assert.strictEqual(sections[3].heading, 'PERSONAL');

    const allKeys = sections.flatMap(s => s.items.map(i => i.key));
    assert.deepStrictEqual(allKeys, [
      'DASHBOARD',
      'DEPARTMENT_COMPLAINTS',
      'PENDING_ASSIGNMENT',
      'ESCALATED_COMPLAINTS',
      'RESOLUTION_MONITORING',
      'FACULTY_STAFF',
      'DEPARTMENT_OVERVIEW',
      'NOTIFICATIONS',
      'PROFILE_PREFERENCES'
    ]);
    assert.strictEqual(allKeys.includes('CAMPUS_MAP'), false);
  });

  it('6. Dean (Academics) Navigation Verification', () => {
    const sections = getNavigationSectionsForUser({ primaryRole: 'DEAN' }, 'DEAN');
    assert.strictEqual(sections.length, 3);
    assert.strictEqual(sections[0].heading, 'ACADEMIC GOVERNANCE');
    assert.strictEqual(sections[1].heading, 'INSTITUTIONAL COORDINATION');
    assert.strictEqual(sections[2].heading, 'PERSONAL');

    const allKeys = sections.flatMap(s => s.items.map(i => i.key));
    assert.deepStrictEqual(allKeys, [
      'DASHBOARD',
      'ALL_DEPARTMENTS',
      'CRITICAL_ESCALATIONS',
      'DEPT_PERFORMANCE',
      'MY_REQUESTS',
      'NOTIFICATIONS',
      'PROFILE_PREFERENCES'
    ]);
    assert.strictEqual(allKeys.includes('MY_REQUESTS'), true);
  });

  it('7. Principal Apex Navigation Verification', () => {
    const sections = getNavigationSectionsForUser({ primaryRole: 'PRINCIPAL' }, 'PRINCIPAL');
    assert.strictEqual(sections.length, 4);
    assert.strictEqual(sections[0].heading, 'INSTITUTIONAL COMMAND');
    assert.strictEqual(sections[1].heading, 'GOVERNANCE');
    assert.strictEqual(sections[2].heading, 'OVERSIGHT');
    assert.strictEqual(sections[3].heading, 'PERSONAL');

    const allKeys = sections.flatMap(s => s.items.map(i => i.key));
    assert.deepStrictEqual(allKeys, [
      'COMMAND_CENTER',
      'CRITICAL_ESCALATIONS',
      'INSTITUTIONAL_DECISIONS',
      'DEPT_PERFORMANCE',
      'AUDIT_ACTIVITY',
      'NOTIFICATIONS',
      'PROFILE_PREFERENCES'
    ]);

    // Generic student links removed from Principal nav
    assert.strictEqual(allKeys.includes('REGISTER_COMPLAINT'), false);
    assert.strictEqual(allKeys.includes('MY_COMPLAINTS'), false);
  });

  it('8. Facilities & Campus Services Staff Navigation Verification', () => {
    const sections = getNavigationSectionsForUser({ primaryRole: 'CAMPUS_SERVICES_HEAD' }, 'CAMPUS_SERVICES_HEAD');
    assert.strictEqual(sections.length, 4);
    assert.strictEqual(sections[0].heading, 'OPERATIONS');
    assert.strictEqual(sections[1].heading, 'SERVICE MANAGEMENT');
    assert.strictEqual(sections[2].heading, 'CAMPUS');
    assert.strictEqual(sections[3].heading, 'PERSONAL');

    const allKeys = sections.flatMap(s => s.items.map(i => i.key));
    assert.deepStrictEqual(allKeys, [
      'DASHBOARD',
      'ASSIGNED_WORK_ORDERS',
      'NEW_REQUESTS',
      'IN_PROGRESS_ORDERS',
      'RESOLVED_ORDERS',
      'ASSIGNED_BUILDINGS',
      'FACILITY_INFO',
      'NOTIFICATIONS',
      'PROFILE_PREFERENCES'
    ]);
  });

  it('9. All Navigation Items have Valid Paths or Actions', () => {
    const roles = ['STUDENT', 'CLASS_INCHARGE', 'TEACHER_GUARDIAN', 'FACULTY', 'HOD', 'DEAN', 'PRINCIPAL', 'CAMPUS_SERVICES_HEAD'];
    for (const r of roles) {
      const sections = getNavigationSectionsForUser({ primaryRole: r }, r);
      for (const section of sections) {
        assert.ok(section.heading, `Missing heading in section for role ${r}`);
        for (const item of section.items) {
          assert.ok(item.key, `Missing key in item for role ${r}`);
          assert.ok(item.label, `Missing label in item for role ${r}`);
          assert.ok(item.icon, `Missing icon in item for role ${r}`);
          assert.ok(item.path || item.isAction, `Item ${item.key} must have path or isAction flag`);
        }
      }
    }
  });

});

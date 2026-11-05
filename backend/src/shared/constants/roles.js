/**
 * CCMS — Approved Role & Assignment Constants
 *
 * ROLES        = Authorization boundaries (who can do what)
 * ASSIGNMENTS  = Operational responsibilities (who handles what scope)
 * SCOPE_TYPES  = What an assignment is scoped to
 *
 * Key principle:
 *   - Roles are STABLE. A faculty is always FACULTY until promoted.
 *   - Assignments are DYNAMIC. Class Incharge changes every academic year.
 *   - Complaint routing reads OrganizationalAssignment, never hardcoded ifs.
 */

const ROLES = {
  STUDENT:    'STUDENT',
  FACULTY:    'FACULTY',
  HOD:        'HOD',
  DEAN:       'DEAN',
  PRINCIPAL:  'PRINCIPAL',
  ADMIN:      'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

const ASSIGNMENT_TYPES = {
  CLASS_INCHARGE:         'CLASS_INCHARGE',
  TEACHER_GUARDIAN:       'TEACHER_GUARDIAN',
  HOD:                    'HOD',
  DEAN:                   'DEAN',
  PRINCIPAL:              'PRINCIPAL',
  CAMPUS_SERVICES_HEAD:   'CAMPUS_SERVICES_HEAD',
  HOSTEL_WARDEN:          'HOSTEL_WARDEN',
  LIBRARY_INCHARGE:       'LIBRARY_INCHARGE',
  LAB_INCHARGE:           'LAB_INCHARGE',
  PLACEMENT_COORDINATOR:  'PLACEMENT_COORDINATOR',
  SPORTS_COORDINATOR:     'SPORTS_COORDINATOR',
  NSS_COORDINATOR:        'NSS_COORDINATOR',
  EXAMINATION_COORDINATOR: 'EXAMINATION_COORDINATOR',
  ANTI_RAGGING_OFFICER:   'ANTI_RAGGING_OFFICER',
  NCC_OFFICER:            'NCC_OFFICER',
};

// What scope an OrganizationalAssignment applies to
const SCOPE_TYPES = {
  DIVISION:    'DIVISION',     // e.g. 2024-IT-A
  DEPARTMENT:  'DEPARTMENT',   // e.g. IT, CSE, ME
  HOSTEL:      'HOSTEL',       // e.g. Boys Block A
  LAB:         'LAB',          // e.g. Software Lab 2
  LIBRARY:     'LIBRARY',
  CAMPUS:      'CAMPUS',       // Entire campus
  BATCH:       'BATCH',        // e.g. Admission batch 2024
  ACADEMIC:    'ACADEMIC',     // Academic scope
  INSTITUTION: 'INSTITUTION',  // Institution level
};

// Complaint routing hierarchy (used by ReferenceDataService)
// ORDER MATTERS — lower index = first assigned handler
const ESCALATION_CHAIN = [
  ASSIGNMENT_TYPES.CLASS_INCHARGE,
  ASSIGNMENT_TYPES.TEACHER_GUARDIAN,
  ROLES.HOD,
  ROLES.DEAN,
  ROLES.PRINCIPAL,
];

// Profile type ↔ role mapping (one source of truth)
const PROFILE_TYPE = {
  STUDENT:    'STUDENT',
  FACULTY:    'FACULTY',
  ADMIN:      'ADMIN',
};

// Login ID prefixes for fast role detection at login
const LOGIN_ID_PATTERNS = {
  STUDENT: /^\d{4}-[A-Z]+-[A-Z]-\d{3}-STD$/i,     // 2024-IT-A-059-STD
  FACULTY: /^EMP-[A-Z]+-\d{3,6}$/i,                // EMP-IT-0031
  ADMIN:   /^ADM-\d{4}$/i,                          // ADM-0001
  SUPER_ADMIN: /^SYS-\d{4}$/i,                      // SYS-0001
  PRINCIPAL: /^EMP-\d{4}$/i,                        // EMP-0001 (no dept segment)
};

module.exports = {
  ROLES,
  ASSIGNMENT_TYPES,
  SCOPE_TYPES,
  ESCALATION_CHAIN,
  PROFILE_TYPE,
  LOGIN_ID_PATTERNS,
};

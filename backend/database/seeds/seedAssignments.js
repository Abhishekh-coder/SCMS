/**
 * CCMS Seed — Organizational Assignments Setup
 */
const mongoose = require('mongoose');
const { OrganizationalAssignmentSchema } = require('../../../database/schema/schemas');
const { ASSIGNMENT_TYPES, SCOPE_TYPES } = require('../../src/shared/constants/roles');

const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment', OrganizationalAssignmentSchema);

async function seedAssignments(employeeMap, academicYearId) {
  console.log('  └─ Seeding Organizational Assignments...');

  const assignmentsList = [
    {
      loginId: 'EMP-ADMIN-0001',
      assignmentType: ASSIGNMENT_TYPES.PRINCIPAL,
      scopeType: SCOPE_TYPES.INSTITUTION,
      scopeId: 'MAIN_CAMPUS',
      scopeLabel: 'Main Campus',
    },
    {
      loginId: 'EMP-ACADEMIC-0001',
      assignmentType: ASSIGNMENT_TYPES.DEAN,
      scopeType: SCOPE_TYPES.ACADEMIC,
      scopeId: 'ACADEMICS',
      scopeLabel: 'Academic Division',
    },
    {
      loginId: 'EMP-IT-0037',
      assignmentType: ASSIGNMENT_TYPES.HOD,
      scopeType: SCOPE_TYPES.DEPARTMENT,
      scopeId: 'IT',
      scopeLabel: 'Information Technology Department',
    },
    {
      loginId: 'EMP-CE-0021',
      assignmentType: ASSIGNMENT_TYPES.HOD,
      scopeType: SCOPE_TYPES.DEPARTMENT,
      scopeId: 'CE',
      scopeLabel: 'Computer Engineering Department',
    },
    {
      loginId: 'EMP-EXTC-0015',
      assignmentType: ASSIGNMENT_TYPES.HOD,
      scopeType: SCOPE_TYPES.DEPARTMENT,
      scopeId: 'EXTC',
      scopeLabel: 'Electronics & Telecommunication Department',
    },
    {
      loginId: 'EMP-IT-0031',
      assignmentType: ASSIGNMENT_TYPES.CLASS_INCHARGE,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-IT-A',
      scopeLabel: 'IT Division A',
    },
    {
      loginId: 'EMP-IT-0032',
      assignmentType: ASSIGNMENT_TYPES.TEACHER_GUARDIAN,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-IT-A',
      scopeLabel: 'IT Division A',
    },
    {
      loginId: 'EMP-CE-0022',
      assignmentType: ASSIGNMENT_TYPES.CLASS_INCHARGE,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-CE-A',
      scopeLabel: 'CE Division A',
    },
    {
      loginId: 'EMP-CE-0023',
      assignmentType: ASSIGNMENT_TYPES.TEACHER_GUARDIAN,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-CE-A',
      scopeLabel: 'CE Division A',
    },
    {
      loginId: 'EMP-IT-0033',
      assignmentType: ASSIGNMENT_TYPES.CLASS_INCHARGE,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-IT-B',
      scopeLabel: 'IT Division B',
    },
    {
      loginId: 'EMP-IT-0034',
      assignmentType: ASSIGNMENT_TYPES.TEACHER_GUARDIAN,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-IT-B',
      scopeLabel: 'IT Division B',
    },
    {
      loginId: 'EMP-IT-0035',
      assignmentType: ASSIGNMENT_TYPES.CLASS_INCHARGE,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-IT-C',
      scopeLabel: 'IT Division C',
    },
    {
      loginId: 'EMP-IT-0036',
      assignmentType: ASSIGNMENT_TYPES.TEACHER_GUARDIAN,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-IT-C',
      scopeLabel: 'IT Division C',
    },
    {
      loginId: 'EMP-CE-0024',
      assignmentType: ASSIGNMENT_TYPES.CLASS_INCHARGE,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-CE-B',
      scopeLabel: 'CE Division B',
    },
    {
      loginId: 'EMP-CE-0025',
      assignmentType: ASSIGNMENT_TYPES.TEACHER_GUARDIAN,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-CE-B',
      scopeLabel: 'CE Division B',
    },
    {
      loginId: 'EMP-EXTC-0016',
      assignmentType: ASSIGNMENT_TYPES.CLASS_INCHARGE,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-EXTC-A',
      scopeLabel: 'EXTC Division A',
    },
    {
      loginId: 'EMP-EXTC-0017',
      assignmentType: ASSIGNMENT_TYPES.TEACHER_GUARDIAN,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-EXTC-A',
      scopeLabel: 'EXTC Division A',
    },
    {
      loginId: 'EMP-EXTC-0018',
      assignmentType: ASSIGNMENT_TYPES.CLASS_INCHARGE,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-EXTC-B',
      scopeLabel: 'EXTC Division B',
    },
    {
      loginId: 'EMP-EXTC-0019',
      assignmentType: ASSIGNMENT_TYPES.TEACHER_GUARDIAN,
      scopeType: SCOPE_TYPES.DIVISION,
      scopeId: '2024-EXTC-B',
      scopeLabel: 'EXTC Division B',
    },
    {
      loginId: 'EMP-CAMPUS-0001',
      assignmentType: ASSIGNMENT_TYPES.CAMPUS_SERVICES_HEAD,
      scopeType: SCOPE_TYPES.DEPARTMENT,
      scopeId: 'CAMPUS_SERVICES',
      scopeLabel: 'Campus Services & Operations',
    },
  ];

  for (const asgn of assignmentsList) {
    const userDoc = employeeMap[asgn.loginId];
    if (!userDoc) {
      console.warn(`⚠️ User with loginId ${asgn.loginId} not found in employeeMap! Skipping assignment.`);
      continue;
    }

    await OrganizationalAssignment.findOneAndUpdate(
      {
        assigneeLoginId: asgn.loginId,
        assignmentType: asgn.assignmentType,
        scopeId: asgn.scopeId,
      },
      {
        assignmentType: asgn.assignmentType,
        assigneeUserId: userDoc._id,
        assigneeLoginId: asgn.loginId,
        scopeType: asgn.scopeType,
        scopeId: asgn.scopeId,
        scopeLabel: asgn.scopeLabel,
        academicYearId,
        academicYearLabel: '2024-25',
        effectiveFrom: new Date('2024-07-01'),
        isPrimary: true,
        isActive: true,
        assignedBy: userDoc._id,
        assignedByLoginId: 'SYSTEM_SEED',
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
      },
      { upsert: true, new: true }
    );
  }

  console.log('  └─ All Organizational Assignments seeded.');
}

module.exports = seedAssignments;

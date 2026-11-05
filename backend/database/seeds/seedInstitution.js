/**
 * CCMS Seed — Academic Year & Roles Setup
 */
const mongoose = require('mongoose');
const {
  AcademicYearSchema,
  RoleSchema,
} = require('../../../database/schema/schemas');
const { ROLES } = require('../../src/shared/constants/roles');

const AcademicYear = mongoose.models.AcademicYear || mongoose.model('AcademicYear', AcademicYearSchema);
const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);

async function seedInstitution() {
  console.log('  └─ Seeding Academic Year & Base Roles...');

  // 1. Current Academic Year
  const currentAY = await AcademicYear.findOneAndUpdate(
    { label: '2024-25' },
    {
      label: '2024-25',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isCurrent: true,
      tenantId: 'tenant_campus_01',
      campusId: 'main_campus',
    },
    { upsert: true, new: true }
  );

  // 2. Base Roles
  const rolesList = [
    { code: ROLES.STUDENT, name: 'Student', description: 'Institutional Student' },
    { code: ROLES.FACULTY, name: 'Faculty', description: 'Academic Faculty' },
    { code: ROLES.HOD, name: 'Head of Department', description: 'Department Head' },
    { code: ROLES.DEAN, name: 'Dean Academics', description: 'Academic Dean' },
    { code: ROLES.PRINCIPAL, name: 'Principal', description: 'Head of Institution' },
    { code: ROLES.ADMIN, name: 'Administrator', description: 'System / Operational Admin' },
    { code: ROLES.SUPER_ADMIN, name: 'Super Admin', description: 'Global System Administrator' },
  ];

  for (const r of rolesList) {
    await Role.findOneAndUpdate(
      { code: r.code },
      { ...r },
      { upsert: true, new: true }
    );
  }

  return { academicYear: currentAY };
}

module.exports = seedInstitution;

/**
 * CCMS Seed — Departments & Divisions Setup
 */
const mongoose = require('mongoose');
const {
  DepartmentSchema,
  DivisionSchema,
} = require('../../../database/schema/schemas');

const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
const Division = mongoose.models.Division || mongoose.model('Division', DivisionSchema);

async function seedDepartments(academicYearId) {
  console.log('  └─ Seeding Departments & Divisions...');

  // 1. Departments
  const departmentsData = [
    { code: 'IT', name: 'Information Technology', shortName: 'IT' },
    { code: 'CE', name: 'Computer Engineering', shortName: 'CE' },
    { code: 'EXTC', name: 'Electronics & Telecommunication', shortName: 'EXTC' },
    { code: 'CAMPUS_SERVICES', name: 'Campus Services & Operations', shortName: 'CAMPUS' },
  ];

  const deptMap = {};
  for (const d of departmentsData) {
    const doc = await Department.findOneAndUpdate(
      { code: d.code },
      {
        ...d,
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    deptMap[d.code] = doc;
  }

  // 2. Divisions
  const divisionsData = [
    // IT Divisions
    { scopeId: '2024-IT-A', batch: 2024, department: 'IT', division: 'A' },
    { scopeId: '2024-IT-B', batch: 2024, department: 'IT', division: 'B' },
    { scopeId: '2024-IT-C', batch: 2024, department: 'IT', division: 'C' },
    // CE Divisions
    { scopeId: '2024-CE-A', batch: 2024, department: 'CE', division: 'A' },
    { scopeId: '2024-CE-B', batch: 2024, department: 'CE', division: 'B' },
    { scopeId: '2024-CE-C', batch: 2024, department: 'CE', division: 'C' },
    // EXTC Divisions
    { scopeId: '2024-EXTC-A', batch: 2024, department: 'EXTC', division: 'A' },
    { scopeId: '2024-EXTC-B', batch: 2024, department: 'EXTC', division: 'B' },
  ];

  const divMap = {};
  for (const div of divisionsData) {
    const doc = await Division.findOneAndUpdate(
      { scopeId: div.scopeId },
      {
        ...div,
        academicYearId,
        tenantId: 'tenant_campus_01',
        campusId: 'main_campus',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    divMap[div.scopeId] = doc;
  }

  return { deptMap, divMap };
}

module.exports = seedDepartments;

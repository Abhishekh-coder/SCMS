/**
 * CCMS Master Seed Script Orchestrator
 *
 * Runs all database seeders idempotently:
 * 1. Institution & Academic Year & Base Roles
 * 2. Departments & Divisions
 * 3. Employee & Faculty Accounts
 * 4. Student Accounts
 * 5. Organizational Assignments (HOD, Dean, Principal, CI, TG, Campus Head)
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ccms_db';

const seedInstitution = require('./seedInstitution');
const seedDepartments = require('./seedDepartments');
const seedEmployees = require('./seedEmployees');
const seedStudents = require('./seedStudents');
const seedAssignments = require('./seedAssignments');

async function runSeed(customUri) {
  const targetUri = customUri || MONGO_URI;
  console.log(`\n🌱 Starting CCMS Institutional Hierarchy Seed at ${targetUri}...`);
  const startTime = Date.now();

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(targetUri);
      console.log('✅ Connected to MongoDB.');
    }

    // 1. Institution & Academic Year & Roles
    const { academicYear } = await seedInstitution();

    // 2. Departments & Divisions
    await seedDepartments(academicYear._id);

    // 3. Employees & Faculty
    const employeeMap = await seedEmployees();

    // 4. Students
    await seedStudents(academicYear._id);

    // 5. Organizational Assignments
    await seedAssignments(employeeMap, academicYear._id);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ CCMS Institutional Seed completed successfully in ${duration}s!`);
    console.log('──────────────────────────────────────────────────────────────────\n');
  } catch (err) {
    console.error('\n❌ Database Seed Failed:', err);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB.');
    }
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;

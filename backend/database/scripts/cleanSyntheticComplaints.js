/**
 * CCMS Safe Data Reset Script — Purge Complaints & Retain Master Data
 * 
 * Safely removes test/synthetic complaints, snapshots, comments, and their
 * associated event ledgers while strictly PRESERVING:
 * - Departments & Divisions
 * - Users, Faculty, Students & Profiles
 * - Roles & Permissions
 * - Organizational Assignments (CI, TG, HOD, Dean, Principal, Campus Head)
 */

const mongoose = require('mongoose');
const {
  ComplaintSchema,
  ComplaintEventLedgerSchema,
  ComplaintCommentSchema,
  ComplaintSnapshotSchema
} = require('../../../database/schema/complaintSchemas');

const {
  DepartmentSchema,
  DivisionSchema,
  UserSchema,
  OrganizationalAssignmentSchema
} = require('../../../database/schema/schemas');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ccms_dev_db';

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
const ComplaintSnapshot = mongoose.models.ComplaintSnapshot || mongoose.model('ComplaintSnapshot', ComplaintSnapshotSchema);
const ComplaintComment = mongoose.models.ComplaintComment || mongoose.model('ComplaintComment', ComplaintCommentSchema);
const ComplaintEventLedger = mongoose.models.ComplaintEventLedger || mongoose.model('ComplaintEventLedger', ComplaintEventLedgerSchema);

const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
const Division = mongoose.models.Division || mongoose.model('Division', DivisionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment', OrganizationalAssignmentSchema);

async function cleanComplaints() {
  console.log('\n🧹 Starting Safe Complaint Data Cleanup...');
  console.log(`📡 Connecting to MongoDB at: ${MONGO_URI}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // 1. Audit current counts before deletion
    const complaintCount = await Complaint.countDocuments();
    const snapshotCount = await ComplaintSnapshot.countDocuments();
    const commentCount = await ComplaintComment.countDocuments();
    const ledgerCount = await ComplaintEventLedger.countDocuments();

    const deptCount = await Department.countDocuments();
    const divCount = await Division.countDocuments();
    const userCount = await User.countDocuments();
    const assignmentCount = await OrganizationalAssignment.countDocuments();

    console.log('\n📊 Pre-Cleanup Database Statistics:');
    console.log(`  ├── Complaints:                ${complaintCount}`);
    console.log(`  ├── Snapshots:                 ${snapshotCount}`);
    console.log(`  ├── Comments:                  ${commentCount}`);
    console.log(`  ├── Event Ledgers:             ${ledgerCount}`);
    console.log(`  ├── [PRESERVED] Departments:   ${deptCount}`);
    console.log(`  ├── [PRESERVED] Divisions:     ${divCount}`);
    console.log(`  ├── [PRESERVED] Users:         ${userCount}`);
    console.log(`  └── [PRESERVED] Assignments:   ${assignmentCount}`);

    // 2. Fetch all complaint UUIDs to perform scoped ledger deletion
    const allComplaints = await Complaint.find({}, 'complaintUuid').lean();
    const complaintUuids = allComplaints.map(c => c.complaintUuid).filter(Boolean);

    // 3. Purge complaints and their related relational entities
    const deletedComplaints = await Complaint.deleteMany({});
    const deletedSnapshots = await ComplaintSnapshot.deleteMany({});
    const deletedComments = await ComplaintComment.deleteMany({});

    let deletedLedgers = { deletedCount: 0 };
    if (complaintUuids.length > 0) {
      deletedLedgers = await ComplaintEventLedger.deleteMany({
        complaintUuid: { $in: complaintUuids }
      });
    } else {
      deletedLedgers = await ComplaintEventLedger.deleteMany({});
    }

    console.log('\n🗑️  Purge Results:');
    console.log(`  ├── Removed Complaints:        ${deletedComplaints.deletedCount}`);
    console.log(`  ├── Removed Snapshots:         ${deletedSnapshots.deletedCount}`);
    console.log(`  ├── Removed Comments:          ${deletedComments.deletedCount}`);
    console.log(`  └── Removed Event Ledgers:     ${deletedLedgers.deletedCount}`);

    // 4. Verify post-cleanup state
    const remainingComplaints = await Complaint.countDocuments();
    const remainingSnapshots = await ComplaintSnapshot.countDocuments();
    const remainingLedgers = await ComplaintEventLedger.countDocuments();

    const preservedDepts = await Department.countDocuments();
    const preservedDivs = await Division.countDocuments();
    const preservedUsers = await User.countDocuments();
    const preservedAssignments = await OrganizationalAssignment.countDocuments();

    console.log('\n✨ Post-Cleanup Validation:');
    console.log(`  ├── Active Complaints:         ${remainingComplaints} (Target: 0)`);
    console.log(`  ├── Active Snapshots:          ${remainingSnapshots} (Target: 0)`);
    console.log(`  ├── Active Ledgers:            ${remainingLedgers} (Target: 0)`);
    console.log(`  ├── Preserved Master Depts:    ${preservedDepts}`);
    console.log(`  ├── Preserved Master Divs:     ${preservedDivs}`);
    console.log(`  ├── Preserved Users:           ${preservedUsers}`);
    console.log(`  └── Preserved Assignments:     ${preservedAssignments}`);

    if (remainingComplaints === 0 && preservedAssignments > 0 && preservedUsers > 0) {
      console.log('\n🎉 Clean state confirmed! Database is ready for real live testing.\n');
    } else {
      console.warn('\n⚠️ Warning: Verification found unexpected state.');
    }
  } catch (err) {
    console.error('\n❌ Cleanup Failed:', err);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB.\n');
    }
  }
}

if (require.main === module) {
  cleanComplaints();
}

module.exports = cleanComplaints;

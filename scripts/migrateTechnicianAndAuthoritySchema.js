/**
 * CampusFix — Migration & Backfill Script
 * Step 1-2 Schema Evolution:
 *   - Initializes independent technicianAssignment structure on existing complaints
 *   - Initializes policyApproval structure on existing complaints
 *   - Initializes rejectionDetails and correctionDetails metadata structures
 *   - Syncs updated fields to CQRS ComplaintSnapshot read model
 *
 * Idempotent: Can be safely re-run multiple times without altering existing data.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const {
  ComplaintSchema,
  ComplaintSnapshotSchema
} = require('../database/schema/complaintSchemas');

const defaultMongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ccms_dev_db';

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
const ComplaintSnapshot = mongoose.models.ComplaintSnapshot || mongoose.model('ComplaintSnapshot', ComplaintSnapshotSchema);

async function runMigration(customUri) {
  const targetUri = customUri || defaultMongoUri;
  console.log(`🚀 Connecting to MongoDB for Schema Evolution & Backfill [${targetUri}]...`);
  try {
    await mongoose.connect(targetUri);
    console.log('Connected to MongoDB.');
  } catch (err) {
    console.error('❌ MongoDB Connection failed:', err.message);
    process.exit(1);
  }

  const complaints = await Complaint.find({});
  console.log(`📋 Total complaint records scanned: ${complaints.length}`);

  let totalUpdated = 0;
  let totalAlreadyMigrated = 0;

  for (const complaint of complaints) {
    let modified = false;

    // 1. technicianAssignment check & initialization
    if (!complaint.technicianAssignment || !complaint.technicianAssignment.status) {
      complaint.technicianAssignment = {
        technicianUserUuid: null,
        technicianName: null,
        trade: null,
        status: 'UNASSIGNED',
        assignedAt: null,
        startedAt: null,
        resolvedAt: null,
        resolutionNotes: '',
        evidenceUrls: []
      };
      modified = true;
    }

    // 2. policyApproval check & initialization
    if (!complaint.policyApproval || !complaint.policyApproval.approvalStatus) {
      complaint.policyApproval = {
        requiresPrincipalApproval: false,
        policyReason: null,
        approvalStatus: 'NOT_REQUIRED',
        decisionByUserUuid: null,
        decisionByName: null,
        decisionNotes: null,
        decisionAt: null
      };
      modified = true;
    }

    // 3. rejectionDetails check & initialization
    if (!complaint.rejectionDetails) {
      complaint.rejectionDetails = {
        rejectedByUserUuid: null,
        rejectedByName: null,
        rejectedByRole: null,
        reason: null,
        rejectedAt: null
      };
      modified = true;
    }

    // 4. correctionDetails check & initialization
    if (!complaint.correctionDetails) {
      complaint.correctionDetails = {
        returnedByUserUuid: null,
        returnedByName: null,
        returnedByRole: null,
        instructions: null,
        returnedAt: null
      };
      modified = true;
    }

    if (modified) {
      await complaint.save();
      totalUpdated++;

      // Sync CQRS Snapshot
      await ComplaintSnapshot.updateOne(
        { complaintUuid: complaint.complaintUuid },
        {
          $set: {
            technicianStatus: complaint.technicianAssignment.status,
            technicianName: complaint.technicianAssignment.technicianName,
            technicianTrade: complaint.technicianAssignment.trade,
            requiresPrincipalApproval: complaint.policyApproval.requiresPrincipalApproval,
            approvalStatus: complaint.policyApproval.approvalStatus,
            lastUpdated: new Date()
          }
        }
      );
    } else {
      totalAlreadyMigrated++;
    }
  }

  console.log('\n========================================');
  console.log('✅ Schema Evolution Migration Complete!');
  console.log(`   Total Scanned:         ${complaints.length}`);
  console.log(`   Updated / Initialized: ${totalUpdated}`);
  console.log(`   Already Up-to-Date:    ${totalAlreadyMigrated}`);
  console.log('========================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { runMigration };

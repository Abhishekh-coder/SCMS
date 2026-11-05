/**
 * CCMS Demo Data Cleanup Script
 * ---------------------------------
 * Deletes ALL complaint records and their linked data from the database:
 *   - complaints                  (root aggregate)
 *   - complaintEventLedger        (immutable audit timeline)
 *   - complaintSnapshots          (CQRS read-model)
 *   - complaintComments
 *   - complaintAttachments
 *   - reportingComplaintFacts     (Power BI fact collection)
 *
 * Usage:  node scripts/cleanupDemoComplaints.js
 * Env:    MONGO_URI (defaults to mongodb://localhost:27017/ccms_dev_db)
 *
 * WARNING: This is destructive and permanent. A backup is recommended.
 */

const mongoose = require('mongoose');

(async () => {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force-production-cleanup')) {
    console.error('⛔ REFUSING TO RUN: cleanupDemoComplaints is blocked in production mode to prevent accidental data loss.');
    console.error('   To force execution on production with verified backup, pass flag: --force-production-cleanup');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ccms_dev_db';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  const db = mongoose.connection.db;
  const complaints = db.collection('complaints');
  const ledger = db.collection('complaintEventLedger');
  const snaps = db.collection('complaintSnapshots');
  const comments = db.collection('complaintComments');
  const atts = db.collection('complaintAttachments');
  const facts = db.collection('reportingComplaintFacts');

  const all = await complaints.find({}).toArray();
  const ids = all.map((d) => d._id);
  const uuids = all.map((d) => d.complaintUuid);
  const codes = all.map((d) => d.complaintCode);

  console.log(`Found complaints: ${all.length}`);

  const results = {
    deleted_complaints: (await complaints.deleteMany({ _id: { $in: ids } })).deletedCount,
    deleted_ledger: (await ledger.deleteMany({ complaintId: { $in: ids } })).deletedCount,
    deleted_snapshots: (await snaps.deleteMany({ complaintUuid: { $in: uuids } })).deletedCount,
    deleted_comments: (await comments.deleteMany({ complaintId: { $in: ids } })).deletedCount,
    deleted_attachments: (await atts.deleteMany({ complaintId: { $in: ids } })).deletedCount,
    deleted_reporting_facts: (await facts.deleteMany({
      $or: [{ complaintUuid: { $in: uuids } }, { complaintCode: { $in: codes } }]
    })).deletedCount
  };

  console.log('Deleted:', JSON.stringify(results, null, 2));
  console.log('Remaining:', JSON.stringify({
    complaints: await complaints.countDocuments({}),
    ledger: await ledger.countDocuments({}),
    snapshots: await snaps.countDocuments({})
  }));

  process.exit(0);
})().catch((err) => {
  console.error('DB_ERROR:', err.message);
  process.exit(1);
});

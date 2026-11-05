require('dotenv').config();
const mongoose = require('mongoose');

const {
  ComplaintSchema,
  ComplaintEventLedgerSchema,
  ComplaintSnapshotSchema
} = require('../database/schema/complaintSchemas');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ccms_v2';

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
const ComplaintEventLedger = mongoose.models.ComplaintEventLedger || mongoose.model('ComplaintEventLedger', ComplaintEventLedgerSchema);
const ComplaintSnapshot = mongoose.models.ComplaintSnapshot || mongoose.model('ComplaintSnapshot', ComplaintSnapshotSchema);

async function runBackfill() {
  console.log('🚀 Connecting to MongoDB for Complaint History Backfill...');
  await mongoose.connect(mongoUri);

  const complaints = await Complaint.find({ isDeleted: false });
  let totalScanned = complaints.length;
  let totalUpdated = 0;
  let totalUnchanged = 0;
  let assignedUuidsBackfilled = 0;
  let forwardedFromRecovered = 0;
  let resolvedByRecovered = 0;
  let snapshotsSynced = 0;

  for (const complaint of complaints) {
    let modified = false;

    // 1. Deduplicate & Backfill assignedUserUuids
    const existingUuids = complaint.assignedUserUuids || [];
    const historyUuids = (complaint.assignmentHistory || []).map(h => h.handlerUserUuid);
    const combinedUuids = Array.from(new Set([
      complaint.assignedToUserUuid,
      ...existingUuids,
      ...historyUuids
    ].filter(Boolean)));

    if (JSON.stringify(existingUuids.sort()) !== JSON.stringify(combinedUuids.sort())) {
      complaint.assignedUserUuids = combinedUuids;
      modified = true;
      assignedUuidsBackfilled++;
    }

    // 2. Recover resolvedByUserUuid from ComplaintEventLedger
    if (['RESOLVED', 'CLOSED'].includes(complaint.status) && !complaint.resolvedByUserUuid) {
      const resolveEvent = await ComplaintEventLedger.findOne({
        complaintId: complaint._id,
        eventType: 'COMPLAINT_RESOLVED'
      }).sort({ timestamp: -1 });

      if (resolveEvent && resolveEvent.actorUuid) {
        complaint.resolvedByUserUuid = resolveEvent.actorUuid;
        complaint.resolvedByName = resolveEvent.actorName;
        modified = true;
        resolvedByRecovered++;
      }
    }

    // 3. Recover forwardedFromUserUuid from ComplaintEventLedger
    if (complaint.status === 'FORWARDED' && !complaint.forwardedFromUserUuid) {
      const fwdEvent = await ComplaintEventLedger.findOne({
        complaintId: complaint._id,
        eventType: 'COMPLAINT_FORWARDED'
      }).sort({ timestamp: -1 });

      if (fwdEvent && fwdEvent.actorUuid) {
        complaint.forwardedFromUserUuid = fwdEvent.actorUuid;
        complaint.forwardedFromName = fwdEvent.actorName;
        modified = true;
        forwardedFromRecovered++;
      }
    }

    if (modified) {
      await complaint.save();
      totalUpdated++;
    } else {
      totalUnchanged++;
    }

    // 4. Sync CQRS Snapshot
    await ComplaintSnapshot.updateOne(
      { complaintUuid: complaint.complaintUuid },
      {
        $set: {
          tenantId: complaint.tenantId,
          complaintCode: complaint.complaintCode,
          title: complaint.title,
          description: complaint.description,
          categoryCode: complaint.categoryCode,
          departmentCode: complaint.departmentCode,
          divisionCode: complaint.divisionCode,
          priority: complaint.priority,
          status: complaint.status,
          createdByUserUuid: complaint.createdByUserUuid,
          createdByName: complaint.createdByName,
          assignedToUserUuid: complaint.assignedToUserUuid || null,
          assignedToName: complaint.assignedToName,
          assignedUserUuids: complaint.assignedUserUuids || [],
          forwardedFromUserUuid: complaint.forwardedFromUserUuid || null,
          forwardedFromName: complaint.forwardedFromName || null,
          resolvedByUserUuid: complaint.resolvedByUserUuid || null,
          resolvedByName: complaint.resolvedByName || null,
          resolutionSlaDeadline: complaint.slaTimers ? complaint.slaTimers.resolutionSlaDeadline : null,
          slaBreached: complaint.slaTimers ? complaint.slaTimers.slaBreached : false,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    snapshotsSynced++;
  }

  console.log('\n📊 Migration Backfill Summary:');
  console.log(`───────────────────────────────────────────`);
  console.log(`Complaints scanned        : ${totalScanned}`);
  console.log(`Complaints updated        : ${totalUpdated}`);
  console.log(`Complaints unchanged      : ${totalUnchanged}`);
  console.log(`assignedUserUuids backfilled: ${assignedUuidsBackfilled}`);
  console.log(`forwardedFromUserUuid recovered: ${forwardedFromRecovered}`);
  console.log(`resolvedByUserUuid recovered : ${resolvedByRecovered}`);
  console.log(`snapshots synced          : ${snapshotsSynced}`);
  console.log(`───────────────────────────────────────────`);
  console.log('✅ Backfill complete!');

  await mongoose.disconnect();
}

runBackfill().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

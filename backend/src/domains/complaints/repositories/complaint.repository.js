const mongoose = require('mongoose');
const { ComplaintSchema } = require('../../../../../database/schema/complaintSchemas');
const { AppError } = require('../../../shared/errors/AppError');

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);

class ComplaintRepository {
  async create(complaintData, session = null) {
    const complaintDoc = new Complaint(complaintData);
    return await complaintDoc.save({ session });
  }

  async findByUuid(complaintUuid, session = null) {
    return await Complaint.findOne({ complaintUuid, isDeleted: false }).session(session);
  }

  async updateStateWithConcurrency(complaintUuid, expectedVersion, updates, session = null) {
    const query = { complaintUuid, version: expectedVersion, isDeleted: false };
    const updateOps = {
      ...updates,
      $inc: { version: 1 }
    };

    const result = await Complaint.findOneAndUpdate(query, updateOps, { new: true, session });
    if (!result) {
      throw new AppError('Concurrency Conflict: Complaint modified by another transaction.', 409, 'CONCURRENCY_ERROR');
    }
    return result;
  }
}

module.exports = new ComplaintRepository();

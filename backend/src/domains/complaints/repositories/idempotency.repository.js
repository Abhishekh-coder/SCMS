const mongoose = require('mongoose');

const idempotencySchema = new mongoose.Schema({
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  userUuid: { type: String, required: true, index: true },
  statusCode: { type: Number, required: true },
  responseData: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 hours TTL
});

const IdempotencyRecord = mongoose.models.IdempotencyRecord || mongoose.model('IdempotencyRecord', idempotencySchema);

class IdempotencyRepository {
  async findByKey(idempotencyKey, userUuid, session = null) {
    if (!idempotencyKey) return null;
    return await IdempotencyRecord.findOne({ idempotencyKey, userUuid }).session(session);
  }

  async saveKey(idempotencyKey, userUuid, statusCode, responseData, session = null) {
    if (!idempotencyKey) return null;
    const doc = new IdempotencyRecord({
      idempotencyKey,
      userUuid,
      statusCode,
      responseData
    });
    return await doc.save({ session });
  }
}

module.exports = new IdempotencyRepository();

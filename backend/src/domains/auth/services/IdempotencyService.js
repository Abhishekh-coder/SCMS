/**
 * CCMS — Idempotency Service
 *
 * Checks & stores Idempotency-Key headers scoped to tenantId, campusId, loginId, endpoint, idempotencyKey.
 */

const crypto = require('crypto');
const { IdempotencyRecord } = require('../models/IdempotencyRecord');
const { logger } = require('../../../config/logger');

class IdempotencyService {
  async process({ idempotencyKey, tenantId = 'tenant_campus_01', campusId = 'main_campus', loginId, endpoint, body }, fn) {
    if (!idempotencyKey) {
      return await fn();
    }

    const requestHash = crypto.createHash('sha256').update(JSON.stringify(body || {})).digest('hex');
    const filter = {
      tenantId,
      campusId,
      endpoint,
      idempotencyKey,
    };
    if (loginId) filter.loginId = loginId.toUpperCase().trim();

    try {
      const existing = await IdempotencyRecord.findOne(filter);
      if (existing) {
        if (existing.expiresAt > new Date() && existing.responseBody) {
          logger.info(`🔁 [IdempotencyService] Returning cached response for key '${idempotencyKey}'`);
          return {
            isCached: true,
            statusCode: existing.statusCode,
            body: existing.responseBody,
          };
        }
      }

      const result = await fn();

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour retention
      await IdempotencyRecord.findOneAndUpdate(
        filter,
        {
          $set: {
            requestHash,
            responseBody: result,
            statusCode: result.statusCode || 200,
            expiresAt,
          }
        },
        { upsert: true, new: true }
      );

      return {
        isCached: false,
        statusCode: result.statusCode || 200,
        body: result,
      };
    } catch (err) {
      // On internal database error, proceed with execution cleanly
      logger.warn('Idempotency check failed, proceeding executing handler:', err.message);
      const res = await fn();
      return { isCached: false, statusCode: res.statusCode || 200, body: res };
    }
  }
}

module.exports = new IdempotencyService();

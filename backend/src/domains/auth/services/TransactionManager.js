const mongoose = require('mongoose');
const { logger } = require('../../../config/logger');

class TransactionManager {
  async executeTransaction(workFn, rollbackFn = null) {
    let session = null;
    let isSessionStarted = false;

    // Detect whether the deployment supports multi-document transactions.
    // Standalone MongoDB (no replica set) rejects them — either eagerly at
    // startTransaction() or lazily on the first write inside the transaction.
    const transactionsSupported = this.isTransactionsSupported();

    if (transactionsSupported) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        isSessionStarted = true;
      } catch (e) {
        logger.warn(`⚠️ MongoDB standalone environment detected. Transactions disabled; falling back to non-atomic execution. (${e.message})`);
        session = null;
        isSessionStarted = false;
      }
    } else {
      logger.warn('⚠️ MongoDB standalone environment detected. Transactions disabled; executing without atomic session.');
    }

    try {
      // 1. Execute work within session (or null)
      const result = await workFn(session);

      if (isSessionStarted && session) {
        await session.commitTransaction();
      }

      return result;
    } catch (error) {
      // Standalone MongoDB throws the transaction error lazily on the first
      // write (e.g. 'Transaction numbers are only allowed on a replica set
      // member or mongos'). Retry the whole work function without a session.
      const txUnsupported = /Transaction numbers are only allowed|replica set member/i.test(error.message || '');
      if (isSessionStarted && session && txUnsupported) {
        logger.warn(`⚠️ Standalone MongoDB detected on first write (${error.message}); retrying without transaction.`);
        try {
          await session.abortTransaction();
        } catch (abortError) {
          // ignore — the driver may have already aborted the transaction
        }
        session.endSession();
        session = null;
        isSessionStarted = false;

        try {
          return await workFn(null);
        } catch (retryError) {
          logger.error('❌ Transaction fallback (non-atomic) failed. Executing Rollback:', retryError.message);
          if (rollbackFn) {
            try {
              await rollbackFn();
              logger.info('✅ Compensating rollback completed successfully.');
            } catch (rollbackError) {
              logger.error('❌ Compensating rollback failed:', rollbackError.message);
            }
          }
          throw retryError;
        }
      }

      logger.error('❌ Transaction Error. Executing Rollback:', error.message);

      if (isSessionStarted && session) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          logger.error('Error aborting session transaction:', abortError.message);
        }
      }

      // 2. Compensating Rollback Fallback
      if (rollbackFn) {
        try {
          await rollbackFn();
          logger.info('✅ Compensating rollback completed successfully.');
        } catch (rollbackError) {
          logger.error('❌ Compensating rollback failed:', rollbackError.message);
        }
      }

      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  /**
   * Detect upfront whether the connected MongoDB deployment supports
   * multi-document transactions (i.e. it is a replica set or sharded cluster).
   */
  isTransactionsSupported() {
    try {
      const conn = mongoose.connection;
      if (!conn || conn.readyState !== 1) {
        return true; // optimistic — the lazy retry still covers standalone
      }
      const topology = conn.client ? conn.client.topology : null;
      const description = topology && topology.description ? topology.description : null;
      const type = description ? description.type : null;
      if (typeof type === 'string' && type.toLowerCase().includes('single')) {
        return false;
      }
      return true;
    } catch (e) {
      return true; // on any detection error, fall back to optimistic + lazy retry
    }
  }
}

module.exports = new TransactionManager();

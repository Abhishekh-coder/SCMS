const mongoose = require('mongoose');
const { logger } = require('./logger');
const { sanitizeMongoUri } = require('./validateEnvironment');

function connectDatabaseConfig() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ccms_db';
  mongoose.set('strictQuery', true);
  return mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 }).then(() => {
    logger.info(`✅ MongoDB Connected successfully to ${sanitizeMongoUri(uri)}`);
  }).catch((error) => {
    logger.warn(`⚠️ MongoDB Connection Warning: ${error.message}. Backend running in offline/standby mode.`);
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: MongoDB connection failed in PRODUCTION mode. Halting server.');
      process.exit(1);
    }
  });
}

module.exports = { connectDatabaseConfig };

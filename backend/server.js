const express = require('express');
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const { logger } = require('./src/config/logger');
const { connectDatabase } = require('./src/bootstrap/database');
const { initializeSocket } = require('./src/bootstrap/socket');
const { initializeRoutes } = require('./src/bootstrap/routes');
const { initializeMiddleware } = require('./src/bootstrap/middleware');
const { initializeScheduler } = require('./src/bootstrap/scheduler');

const app = express();
const server = http.createServer(app);

const { validateEnvironment } = require('./src/config/validateEnvironment');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 0. Audit & Validate Environment Variables
    const { isValid } = validateEnvironment();
    if (!isValid && process.env.NODE_ENV === 'production') {
      logger.error('Startup aborted due to critical production configuration defects.');
      process.exit(1);
    }

    // 1. Connect Database
    await connectDatabase();

    // 2. Initialize Express Middleware
    initializeMiddleware(app);

    // 3. Initialize Socket.io
    initializeSocket(server);

    // 4. Initialize API v1 Routes
    initializeRoutes(app);

    // 5. Initialize Centralized Background Scheduler
    initializeScheduler();

    server.listen(PORT, () => {
      logger.info(`🚀 CCMS Backend Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`📌 API Prefix: ${process.env.API_PREFIX || '/api/v1'}`);
      logger.info(`📧 [SMTP Startup Audit] User: ${process.env.SMTP_USER || 'N/A'} | From: ${process.env.EMAIL_FROM || process.env.SMTP_FROM || 'N/A'}`);
    });
  } catch (error) {
    logger.error('Failed to launch CCMS Server:', error);
    process.exit(1);
  }
}

startServer();

const { logger } = require('../config/logger');
const { runSlaEscalations } = require('../scheduler/escalation/slaEscalator');
const { runDailySnapshots } = require('../scheduler/snapshots/dailySnapshot');

function initializeScheduler() {
  logger.info('⏰ Centralized Background Scheduler Initialized');
  
  // Schedule SLA Escalation check every 15 minutes
  setInterval(async () => {
    try {
      await runSlaEscalations();
    } catch (err) {
      logger.error('Error running SLA escalation job:', err);
    }
  }, 15 * 60 * 1000);

  // Schedule Daily Analytics Reporting Snapshot every 24 hours
  setInterval(async () => {
    try {
      await runDailySnapshots();
    } catch (err) {
      logger.error('Error running daily snapshot job:', err);
    }
  }, 24 * 60 * 60 * 1000);
}

module.exports = { initializeScheduler };

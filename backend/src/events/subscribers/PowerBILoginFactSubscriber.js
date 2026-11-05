const mongoose = require('mongoose');
const eventPublisher = require('../publishers/EventPublisher');
const { ReportingLoginFactSchema } = require('../../../database/schema/schemas');
const { logger } = require('../../config/logger');

const ReportingLoginFact = mongoose.models.ReportingLoginFact || mongoose.model('ReportingLoginFact', ReportingLoginFactSchema);

class PowerBILoginFactSubscriber {
  constructor() {
    this.init();
  }

  init() {
    eventPublisher.on('UserLoggedIn', this.handleUserLoggedIn.bind(this));
    eventPublisher.on('LoginFailed', this.handleLoginFailed.bind(this));
  }

  getDateKey(date = new Date()) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return parseInt(`${yyyy}${mm}${dd}`, 10);
  }

  async handleUserLoggedIn(event) {
    try {
      const { userUuid, roles, ipAddress, browser, deviceName } = event.payload;
      const dateKey = this.getDateKey(new Date(event.timestamp || Date.now()));

      const fact = new ReportingLoginFact({
        dateKey,
        userUuid,
        role: Array.isArray(roles) && roles.length > 0 ? roles[0] : 'STUDENT',
        department: 'GENERAL',
        loginSuccess: true,
        deviceType: deviceName || 'DESKTOP',
        browser: browser || 'UNKNOWN',
        ipAddress: ipAddress || '127.0.0.1'
      });

      await fact.save();
      logger.info(`📊 [PowerBI Ingestion] Logged ReportingLoginFact for userUuid=${userUuid}`);
    } catch (error) {
      logger.error('❌ Error in PowerBILoginFactSubscriber:', error);
    }
  }

  async handleLoginFailed(event) {
    try {
      const { userUuid, ipAddress } = event.payload;
      const dateKey = this.getDateKey(new Date(event.timestamp || Date.now()));

      const fact = new ReportingLoginFact({
        dateKey,
        userUuid: userUuid || 'ANONYMOUS',
        role: 'UNKNOWN',
        department: 'GENERAL',
        loginSuccess: false,
        deviceType: 'DESKTOP',
        browser: 'UNKNOWN',
        ipAddress: ipAddress || '127.0.0.1'
      });

      await fact.save();
      logger.info(`📊 [PowerBI Ingestion] Logged Failed ReportingLoginFact`);
    } catch (error) {
      logger.error('❌ Error in PowerBILoginFactSubscriber (LoginFailed):', error);
    }
  }
}

module.exports = new PowerBILoginFactSubscriber();

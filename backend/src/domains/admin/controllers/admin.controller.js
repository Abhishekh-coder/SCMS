const healthCheckService = require('../services/HealthCheckService');
const featureFlagService = require('../services/FeatureFlagService');
const dataQualityEngine = require('../../analytics/services/DataQualityEngine');
const { AppError, ValidationError } = require('../../../shared/errors/AppError');
const crypto = require('crypto');

class AdminController {
  async getHealth(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const diagnostics = await healthCheckService.runDiagnostics();

      return res.status(200).json({
        success: true,
        message: 'System health diagnostics completed.',
        data: diagnostics,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleFeatureFlag(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { flagCode, isEnabled, name, description } = req.body || {};

      if (!flagCode) {
        throw new ValidationError('flagCode is required.', 'VAL_001');
      }

      const flag = await featureFlagService.setFeatureFlag(flagCode, isEnabled, name, description);

      return res.status(200).json({
        success: true,
        message: `Feature flag '${flagCode}' updated.`,
        data: flag,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async runDataQualityAudit(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const audit = await dataQualityEngine.runAudit();

      return res.status(200).json({
        success: true,
        message: 'Data quality engine audit completed.',
        data: audit,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();

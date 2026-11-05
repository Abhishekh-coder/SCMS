const { describe, it } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');

const featureFlagService = require('../../backend/src/domains/admin/services/FeatureFlagService');
const healthCheckService = require('../../backend/src/domains/admin/services/HealthCheckService');
const moduleRegistry = require('../../backend/src/domains/admin/services/ModuleRegistry');
const secretService = require('../../backend/src/security/SecretService');
const dataQualityEngine = require('../../backend/src/domains/analytics/services/DataQualityEngine');
const { FeatureFlagSchema, SystemConfigSchema } = require('../../database/schema/adminSchemas');

describe('Phase 7 & 8 - Control Plane, Governance & Health Diagnostics Unit Tests', () => {
  const FeatureFlag = mongoose.models.TestFeatureFlag2 || mongoose.model('TestFeatureFlag2', FeatureFlagSchema);
  const SystemConfig = mongoose.models.TestSystemConfig2 || mongoose.model('TestSystemConfig2', SystemConfigSchema);

  it('1. should validate FeatureFlagSchema format and defaults', () => {
    const flag = new FeatureFlag({
      flagCode: 'AI_TRIAGE_ENABLED',
      name: 'AI Triage Feature',
      description: 'Enables smart AI complaint categorization',
      isEnabled: true
    });

    assert.strictEqual(flag.validateSync(), undefined);
    assert.strictEqual(flag.flagCode, 'AI_TRIAGE_ENABLED');
    assert.strictEqual(flag.isEnabled, true);
  });

  it('2. should evaluate feature flag status using FeatureFlagService', async () => {
    const enabled = await featureFlagService.isFeatureEnabled('AI_TRIAGE_ENABLED');
    assert.strictEqual(typeof enabled, 'boolean');
  });

  it('3. should run system diagnostics via HealthCheckService', async () => {
    const diag = await healthCheckService.runDiagnostics();
    assert.ok(diag);
    assert.ok(diag.status);
    assert.ok(diag.components.database);
    assert.ok(diag.components.notificationQueue);
    assert.ok(diag.components.aiProvider);
  });

  it('4. should retrieve secrets using SecretService abstraction', () => {
    const jwtSecret = secretService.getJwtSecret();
    const apiKey = secretService.getChatbotApiKey();
    assert.ok(jwtSecret);
    assert.ok(apiKey);
  });

  it('5. should register and retrieve plugin extension modules via ModuleRegistry', () => {
    const modules = moduleRegistry.getModules();
    assert.ok(Array.isArray(modules));
    assert.ok(modules.length >= 4);
    assert.strictEqual(modules[0].moduleCode, 'HOSTEL');
  });
});

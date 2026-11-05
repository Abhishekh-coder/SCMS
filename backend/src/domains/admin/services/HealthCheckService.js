const mongoose = require('mongoose');
const notificationQueue = require('../../notifications/queue/NotificationQueue');
const geminiProvider = require('../../../infrastructure/ai/GeminiProvider');

class HealthCheckService {
  async runDiagnostics() {
    const mongoState = mongoose.connection.readyState;
    const mongoStatusMap = { 0: 'DISCONNECTED', 1: 'CONNECTED', 2: 'CONNECTING', 3: 'DISCONNECTING' };

    // Real MongoDB ping latency (ms)
    let mongoLatencyMs = null;
    if (mongoState === 1) {
      try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        mongoLatencyMs = Date.now() - start;
      } catch (err) {
        mongoLatencyMs = null;
      }
    }

    // Notification queue: real pending job count
    const pendingJobs = notificationQueue.queue ? notificationQueue.queue.length : 0;

    // AI provider: real readiness probe (no API call — just config status)
    const aiProviderReady = Boolean(geminiProvider && geminiProvider.modelName);

    const diagnostics = {
      status: mongoState === 1 ? 'HEALTHY' : 'DEGRADED',
      components: {
        database: {
          status: mongoStatusMap[mongoState] || 'UNKNOWN',
          readyState: mongoState,
          latencyMs: mongoLatencyMs
        },
        notificationQueue: {
          status: pendingJobs >= 0 ? 'HEALTHY' : 'UNKNOWN',
          pendingJobs
        },
        aiProvider: {
          status: aiProviderReady ? 'CONFIGURED' : 'NOT_CONFIGURED',
          model: geminiProvider.modelName || null,
          provider: geminiProvider.providerName || null
        }
      },
      timestamp: new Date().toISOString()
    };

    return diagnostics;
  }
}

module.exports = new HealthCheckService();

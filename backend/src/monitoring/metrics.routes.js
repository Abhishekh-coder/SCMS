const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date(),
    metrics: {
      operational: {
        activeConnections: 42,
        requestsPerMinute: 310,
        queueLength: 0
      },
      business: {
        dailyComplaintCreationRate: 28,
        dailyResolutionRate: 26,
        currentEscalationRatePercent: 2.1
      },
      security: {
        failedLoginAttemptsLastHour: 1,
        activeJwtSessions: 184
      },
      performance: {
        avgApiLatencyMs: 24,
        p95ApiLatencyMs: 48,
        databaseQueryLatencyMs: 4.2
      }
    }
  });
});

module.exports = router;

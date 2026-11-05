const apiV1Router = require('../api/v1/router');

function initializeRoutes(app) {
  // Defensive: Git-Bash/MSYS path conversion can turn '/api/v1' into
  // 'C:/Program Files/Git/api/v1' in the environment. Extract the real
  // URL prefix from the first '/api/' segment when that happens.
  const rawPrefix = process.env.API_PREFIX || '/api/v1';
  const apiIdx = rawPrefix.indexOf('/api/');
  const prefix = apiIdx >= 0 ? rawPrefix.slice(apiIdx) : rawPrefix;

  app.get('/', (req, res) => {
    res.json({
      name: 'CCMS (Campus Management & Complaint System) Enterprise API',
      version: '1.0.0',
      status: 'operational',
      documentation: `${prefix}/docs`
    });
  });

  app.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(isDbConnected ? 200 : 503).json({
      status: isDbConnected ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: {
        database: isDbConnected ? 'UP' : 'DISCONNECTED',
        scheduler: 'UP',
        eventBus: 'UP'
      }
    });
  });

  app.use(prefix, apiV1Router);

  // Fallback 404 Handler
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.originalUrl} does not exist on CCMS API.`
      }
    });
  });

  // Centralized Global Error Handler
  const { globalErrorHandler } = require('../middleware/errorHandler');
  app.use(globalErrorHandler);
}

module.exports = { initializeRoutes };

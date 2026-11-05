const path = require('path');

let logger;

try {
  const winston = require('winston');
  const logDir = path.join(__dirname, '../../../logs');

  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'ccms-backend' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack }) => {
            return `[${timestamp}] ${level}: ${message}${stack ? `\n${stack}` : ''}`;
          })
        )
      })
    ]
  });
} catch (e) {
  // Fallback logger for zero-dependency environment checks
  logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    debug: (...args) => console.log('[DEBUG]', ...args)
  };
}

module.exports = { logger };

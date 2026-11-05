module.exports = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_32chars_long',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_32chars_long',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d'
};

const identityConfig = {
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    historyLimit: 5
  },
  sessionPolicy: {
    maxActiveSessionsPerUser: 5,
    sessionTimeoutMinutes: 60,
    allowTrustedDeviceBypass: true
  },
  otpPolicy: {
    expiryMinutes: 5,
    maxAttempts: 3,
    resendIntervalSeconds: 60
  },
  lockoutPolicy: {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30
  },
  jwtPolicy: {
    accessTokenExpiration: '15m',
    refreshTokenExpiration: '7d'
  }
};

module.exports = identityConfig;

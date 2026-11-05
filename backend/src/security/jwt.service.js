const jwt = require('jsonwebtoken');
const { AppError } = require('../shared/errors/AppError');
const { logger } = require('../config/logger');

class JwtService {
  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_key_ccms_phase1_local_dev';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_ccms_phase1_local_dev';
    this.accessExp = process.env.JWT_ACCESS_EXPIRATION || '15m';
    this.refreshExp = process.env.JWT_REFRESH_EXPIRATION || '7d';
  }

  generateAccessToken(payload) {
    return jwt.sign(payload, this.accessSecret, { expiresIn: this.accessExp });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: this.refreshExp });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const err = new AppError('Access token has expired.', 401, 'AUTH_007');
        err.isExpiredToken = true;
        throw err;
      }
      throw new AppError('Invalid access token.', 401, 'AUTH_007');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token has expired.', 401, 'AUTH_004');
      }
      throw new AppError('Invalid refresh token.', 401, 'AUTH_004');
    }
  }
}

module.exports = new JwtService();

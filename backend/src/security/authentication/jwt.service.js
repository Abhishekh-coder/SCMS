const jwt = require('jsonwebtoken');
const jwtConfig = require('../../config/jwt');

class JwtService {
  generateAccessToken(payload) {
    return jwt.sign(payload, jwtConfig.accessSecret, { expiresIn: jwtConfig.accessExpiration });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiration });
  }

  verifyAccessToken(token) {
    return jwt.verify(token, jwtConfig.accessSecret);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, jwtConfig.refreshSecret);
  }
}

module.exports = new JwtService();

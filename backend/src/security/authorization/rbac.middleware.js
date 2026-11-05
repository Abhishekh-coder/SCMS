const jwtService = require('../authentication/jwt.service');
const { UnauthorizedError, ForbiddenError } = require('../../shared/errors/AppError');

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token required in Authorization header.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwtService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid or expired access token.'));
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ForbiddenError('User identity context missing.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' is not authorized to access this resource.`));
    }

    next();
  };
}

module.exports = { authenticateUser, authorizeRoles };

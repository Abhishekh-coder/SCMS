const authorizationEngine = require('./authorizationEngine');
const eventPublisher = require('../events/publishers/EventPublisher');
const { AppError } = require('../shared/errors/AppError');

function authorize(requiredPermission, policyOptions = {}) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication required before authorization check.', 401, 'AUTH_007');
      }

      const resourceContext = req.resourceContext || req.body || req.params;
      const evaluation = await authorizationEngine.evaluateAccess(user, requiredPermission, policyOptions, resourceContext);

      if (!evaluation.allowed) {
        // Publish PermissionDenied event
        await eventPublisher.publish('PermissionDenied', {
          userUuid: user.userUuid,
          requiredPermission,
          reason: evaluation.reason,
          path: req.originalUrl,
          method: req.method,
          occurredAt: new Date().toISOString()
        });

        throw new AppError(`Access Denied: Insufficient permissions for action '${requiredPermission}'. Reason: ${evaluation.reason}`, 403, 'AUTH_008');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { authorize };

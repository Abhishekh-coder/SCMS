const express = require('express');
const adminController = require('./controllers/admin.controller');
const { authenticateToken } = require('../../security/authenticate.middleware');
const { authorize } = require('../../security/authorize.middleware');

const router = express.Router();

// All Control Plane Admin routes require JWT authentication
router.use(authenticateToken);

// GET /api/v1/admin/health -> System health & component diagnostics
router.get('/health', (req, res, next) => adminController.getHealth(req, res, next));

// POST /api/v1/admin/feature-flags -> Dynamic feature flag toggle (requires user:manage permission)
router.post('/feature-flags', authorize('user:manage'), (req, res, next) => adminController.toggleFeatureFlag(req, res, next));

// GET /api/v1/admin/data-quality -> Data Quality Engine audit scan
router.get('/data-quality', authorize('user:manage'), (req, res, next) => adminController.runDataQualityAudit(req, res, next));

module.exports = router;

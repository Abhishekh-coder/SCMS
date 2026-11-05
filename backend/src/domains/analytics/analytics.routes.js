const express = require('express');
const analyticsController = require('./controllers/analytics.controller');
const { authenticateToken } = require('../../security/authenticate.middleware');
const { authorize } = require('../../security/authorize.middleware');

const router = express.Router();

// All analytics routes require JWT authentication
router.use(authenticateToken);

// Role-Based Dashboards
router.get('/dashboards/student', (req, res, next) => analyticsController.getStudentDashboard(req, res, next));
router.get('/dashboards/faculty', (req, res, next) => analyticsController.getFacultyDashboard(req, res, next));
router.get('/dashboards/hod', authorize('analytics:view'), (req, res, next) => analyticsController.getHodDashboard(req, res, next));
router.get('/dashboards/dean', authorize('analytics:view'), (req, res, next) => analyticsController.getExecutiveDashboard(req, res, next));
router.get('/dashboards/principal', authorize('analytics:view'), (req, res, next) => analyticsController.getExecutiveDashboard(req, res, next));

// Report Export
router.get('/reports/export', authorize('analytics:view'), (req, res, next) => analyticsController.exportReport(req, res, next));

module.exports = router;

const express = require('express');
const router = express.Router();

const authRoutes = require('../../domains/auth/auth.routes');
const complaintRoutes = require('../../domains/complaints/complaint.routes');
const workflowRoutes = require('../../domains/workflow/workflow.routes');
const userRoutes = require('../../domains/users/user.routes');
const analyticsRoutes = require('../../domains/analytics/analytics.routes');
const notificationRoutes = require('../../domains/notifications/notification.routes');
const adminRoutes = require('../../domains/admin/admin.routes');
const healthRoutes = require('../../domains/settings/health.routes');
const metricsRoutes = require('../../monitoring/metrics.routes');
const publicRoutes = require('../../domains/public/public.routes'); // No auth required

// API Version 1 Route Registrations
router.use('/public', publicRoutes);  // No auth — open to landing page
router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/workflow', workflowRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);
router.use('/metrics', metricsRoutes);

module.exports = router;

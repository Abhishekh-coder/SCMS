const express = require('express');
const notificationController = require('./controllers/notification.controller');
const { authenticateToken } = require('../../security/authenticate.middleware');

const router = express.Router();

// All notification routes require JWT authentication
router.use(authenticateToken);

// GET /api/v1/notifications -> List notifications
router.get('/', (req, res, next) => notificationController.getNotifications(req, res, next));

// GET /api/v1/notifications/unread-count -> Unread count badge
router.get('/unread-count', (req, res, next) => notificationController.getUnreadCount(req, res, next));

// PATCH /api/v1/notifications/:notificationUuid/read -> Mark single notification as read
router.patch('/:notificationUuid/read', (req, res, next) => notificationController.markAsRead(req, res, next));

// PATCH /api/v1/notifications/read-all -> Mark all notifications as read
router.patch('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));

module.exports = router;

const mongoose = require('mongoose');
const { NotificationSchema, NotificationPreferenceSchema } = require('../../../../../database/schema/notificationSchemas');
const { AppError, ValidationError } = require('../../../shared/errors/AppError');
const crypto = require('crypto');

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const NotificationPreference = mongoose.models.NotificationPreference || mongoose.model('NotificationPreference', NotificationPreferenceSchema);

class NotificationController {
  async getNotifications(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const query = { userUuid: req.user.userUuid, isDeleted: false };
      if (unreadOnly === 'true') query.readStatus = false;

      const skip = (Number(page) - 1) * Number(limit);
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ userUuid: req.user.userUuid, readStatus: false, isDeleted: false });

      return res.status(200).json({
        success: true,
        message: 'Notification center items retrieved.',
        data: notifications,
        meta: {
          total,
          unreadCount,
          page: Number(page),
          limit: Number(limit),
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const unreadCount = await Notification.countDocuments({ userUuid: req.user.userUuid, readStatus: false, isDeleted: false });

      return res.status(200).json({
        success: true,
        data: { unreadCount },
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { notificationUuid } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { notificationUuid, userUuid: req.user.userUuid },
        { $set: { readStatus: true, readAt: new Date() } },
        { new: true }
      );

      if (!notification) {
        throw new AppError(`Notification '${notificationUuid}' not found.`, 404, 'NOT_FOUND');
      }

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: notification,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      await Notification.updateMany(
        { userUuid: req.user.userUuid, readStatus: false },
        { $set: { readStatus: true, readAt: new Date() } }
      );

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();

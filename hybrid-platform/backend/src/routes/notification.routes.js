const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

// @route   GET /api/notifications
// @desc    Get notifications for current user
// @access  Private
router.get('/', auth, notificationController.getNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, notificationController.markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, notificationController.markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, notificationController.deleteNotification);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', auth, notificationController.getUnreadCount);

module.exports = router;

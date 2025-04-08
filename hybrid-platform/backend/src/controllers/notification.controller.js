const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username fullName avatar');

    const total = await Notification.countDocuments({ recipient: req.user.id });
    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      unreadCount
    });
  } catch (err) {
    console.error('Error in getNotifications controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if notification belongs to current user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Mark as read
    await notification.markAsRead();

    res.json({ success: true });
  } catch (err) {
    console.error('Error in markAsRead controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error in markAllAsRead controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if notification belongs to current user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await notification.remove();

    res.json({ message: 'Notification removed' });
  } catch (err) {
    console.error('Error in deleteNotification controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);

    res.json({ count });
  } catch (err) {
    console.error('Error in getUnreadCount controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

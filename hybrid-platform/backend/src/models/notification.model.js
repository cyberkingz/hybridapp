const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: ['follow', 'like', 'comment', 'mention', 'stream', 'system'],
    required: true
  },
  contentType: {
    type: String,
    enum: ['post', 'video', 'stream', 'code', 'comment', 'user', 'system'],
    required: true
  },
  contentId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'contentModel'
  },
  contentModel: {
    type: String,
    required: true,
    enum: ['Post', 'Video', 'Stream', 'CodeSession', 'Comment', 'User', 'System']
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  url: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Method to mark notification as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Static method to create a new notification
NotificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = new this({
      recipient: data.recipient,
      sender: data.sender || null,
      type: data.type,
      contentType: data.contentType,
      contentId: data.contentId,
      contentModel: data.contentModel,
      message: data.message,
      url: data.url || null
    });
    
    return await notification.save();
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

// Static method to get unread notifications count for a user
NotificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    return await this.countDocuments({
      recipient: userId,
      isRead: false
    });
  } catch (err) {
    console.error('Error getting unread notifications count:', err);
    throw err;
  }
};

module.exports = mongoose.model('Notification', NotificationSchema);

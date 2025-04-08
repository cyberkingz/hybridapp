const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StreamSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled'
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  recordingUrl: {
    type: String,
    default: null
  },
  viewers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  polls: [{
    type: Schema.Types.ObjectId,
    ref: 'StreamPoll'
  }],
  codeSessions: [{
    type: Schema.Types.ObjectId,
    ref: 'CodeSession'
  }]
}, {
  timestamps: true
});

// Virtual for viewer count
StreamSchema.virtual('viewerCount').get(function() {
  return this.viewers.length;
});

// Virtual for comment count
StreamSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to start stream
StreamSchema.methods.startStream = function() {
  this.status = 'live';
  this.startedAt = new Date();
  return this.save();
};

// Method to end stream
StreamSchema.methods.endStream = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  return this.save();
};

// Method to add a viewer
StreamSchema.methods.addViewer = function(userId) {
  if (!this.viewers.includes(userId)) {
    this.viewers.push(userId);
  }
  return this.save();
};

// Method to remove a viewer
StreamSchema.methods.removeViewer = function(userId) {
  this.viewers = this.viewers.filter(
    viewerId => viewerId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add a comment reference
StreamSchema.methods.addComment = function(commentId) {
  this.comments.push(commentId);
  return this.save();
};

// Method to add a poll reference
StreamSchema.methods.addPoll = function(pollId) {
  this.polls.push(pollId);
  return this.save();
};

// Method to add a code session reference
StreamSchema.methods.addCodeSession = function(sessionId) {
  this.codeSessions.push(sessionId);
  return this.save();
};

// Method to add a tag
StreamSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

// Static method to find active streams
StreamSchema.statics.findActive = function() {
  return this.find({ status: 'live' }).sort({ startedAt: -1 });
};

// Static method to find streams by tag
StreamSchema.statics.findByTag = function(tag) {
  return this.find({ tags: tag }).sort({ startedAt: -1 });
};

module.exports = mongoose.model('Stream', StreamSchema);

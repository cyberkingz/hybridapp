const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  contentType: {
    type: String,
    enum: ['post', 'video', 'stream', 'code'],
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
    enum: ['Post', 'Video', 'Stream', 'CodeSession']
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for like count
CommentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for reply count
CommentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Method to add a like
CommentSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }
  return this.save();
};

// Method to remove a like
CommentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(
    likeId => likeId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add a reply reference
CommentSchema.methods.addReply = function(replyId) {
  this.replies.push(replyId);
  return this.save();
};

// Method to remove a reply reference
CommentSchema.methods.removeReply = function(replyId) {
  this.replies = this.replies.filter(
    id => id.toString() !== replyId.toString()
  );
  return this.save();
};

module.exports = mongoose.model('Comment', CommentSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoSchema = new Schema({
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
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  views: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
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
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for view count
VideoSchema.virtual('viewCount').get(function() {
  return this.views.length;
});

// Virtual for like count
VideoSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
VideoSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to add a view
VideoSchema.methods.addView = function(userId) {
  if (!this.views.includes(userId)) {
    this.views.push(userId);
  }
  return this.save();
};

// Method to add a like
VideoSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }
  return this.save();
};

// Method to remove a like
VideoSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(
    likeId => likeId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add a comment reference
VideoSchema.methods.addComment = function(commentId) {
  this.comments.push(commentId);
  return this.save();
};

// Method to remove a comment reference
VideoSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(
    id => id.toString() !== commentId.toString()
  );
  return this.save();
};

// Method to add a tag
VideoSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

// Static method to find videos by tag
VideoSchema.statics.findByTag = function(tag) {
  return this.find({ tags: tag, isPublished: true }).sort({ createdAt: -1 });
};

// Static method to find trending videos
VideoSchema.statics.findTrending = function(limit = 10) {
  return this.aggregate([
    {
      $match: { isPublished: true }
    },
    {
      $addFields: {
        viewCount: { $size: "$views" },
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" }
      }
    },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: ["$viewCount", 0.5] },
            "$likeCount",
            { $multiply: ["$commentCount", 2] }
          ]
        }
      }
    },
    {
      $sort: { score: -1, createdAt: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('Video', VideoSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  mediaUrls: {
    type: [String],
    default: []
  },
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
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for like count
PostSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
PostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to add a like
PostSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }
  return this.save();
};

// Method to remove a like
PostSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(
    likeId => likeId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add a comment reference
PostSchema.methods.addComment = function(commentId) {
  this.comments.push(commentId);
  return this.save();
};

// Method to remove a comment reference
PostSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(
    id => id.toString() !== commentId.toString()
  );
  return this.save();
};

// Method to add a tag
PostSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

// Static method to find posts by tag
PostSchema.statics.findByTag = function(tag) {
  return this.find({ tags: tag }).sort({ createdAt: -1 });
};

// Static method to find trending posts
PostSchema.statics.findTrending = function(limit = 10) {
  return this.aggregate([
    {
      $addFields: {
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" }
      }
    },
    {
      $addFields: {
        score: {
          $add: [
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

module.exports = mongoose.model('Post', PostSchema);

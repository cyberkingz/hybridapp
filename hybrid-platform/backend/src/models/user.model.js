const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  avatar: {
    type: String,
    default: null
  },
  skills: {
    type: [String],
    default: []
  },
  points: {
    type: Number,
    default: 0
  },
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  badges: [{
    type: Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for follower count
UserSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Virtual for following count
UserSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

// Method to check if user is following another user
UserSchema.methods.isFollowing = function(userId) {
  return this.following.some(followingId => followingId.toString() === userId.toString());
};

// Method to add a follower
UserSchema.methods.addFollower = function(userId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
  }
  return this.save();
};

// Method to remove a follower
UserSchema.methods.removeFollower = function(userId) {
  this.followers = this.followers.filter(
    followerId => followerId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to follow a user
UserSchema.methods.follow = function(userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId);
  }
  return this.save();
};

// Method to unfollow a user
UserSchema.methods.unfollow = function(userId) {
  this.following = this.following.filter(
    followingId => followingId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add points
UserSchema.methods.addPoints = function(points) {
  this.points += points;
  return this.save();
};

// Method to add a badge
UserSchema.methods.addBadge = function(badgeId) {
  if (!this.badges.includes(badgeId)) {
    this.badges.push(badgeId);
  }
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);

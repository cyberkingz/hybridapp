const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BadgeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['content', 'social', 'coding', 'streaming', 'general'],
    required: true
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  requirements: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Static method to check if a user qualifies for a badge
BadgeSchema.statics.checkQualification = async function(userId, badgeId) {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const badge = await this.findById(badgeId);
    
    if (!badge) {
      throw new Error('Badge not found');
    }
    
    // Check if user already has this badge
    if (user.badges.includes(badgeId)) {
      return { qualified: false, reason: 'User already has this badge' };
    }
    
    // Check requirements based on badge category
    let qualified = false;
    let stats = {};
    
    switch (badge.category) {
      case 'content':
        // Check content creation requirements
        const Post = mongoose.model('Post');
        const Video = mongoose.model('Video');
        
        const postCount = await Post.countDocuments({ user: userId });
        const videoCount = await Video.countDocuments({ user: userId });
        
        stats = { postCount, videoCount };
        
        if (badge.requirements.postCount && postCount >= badge.requirements.postCount) {
          qualified = true;
        }
        
        if (badge.requirements.videoCount && videoCount >= badge.requirements.videoCount) {
          qualified = true;
        }
        break;
        
      case 'social':
        // Check social interaction requirements
        const followerCount = user.followers.length;
        const followingCount = user.following.length;
        
        stats = { followerCount, followingCount };
        
        if (badge.requirements.followerCount && followerCount >= badge.requirements.followerCount) {
          qualified = true;
        }
        
        if (badge.requirements.followingCount && followingCount >= badge.requirements.followingCount) {
          qualified = true;
        }
        break;
        
      case 'coding':
        // Check coding activity requirements
        const CodeSession = mongoose.model('CodeSession');
        const codeSessionCount = await CodeSession.countDocuments({ owner: userId });
        
        stats = { codeSessionCount };
        
        if (badge.requirements.codeSessionCount && codeSessionCount >= badge.requirements.codeSessionCount) {
          qualified = true;
        }
        break;
        
      case 'streaming':
        // Check streaming activity requirements
        const Stream = mongoose.model('Stream');
        const streamCount = await Stream.countDocuments({ user: userId });
        
        stats = { streamCount };
        
        if (badge.requirements.streamCount && streamCount >= badge.requirements.streamCount) {
          qualified = true;
        }
        break;
        
      case 'general':
        // Check general platform usage requirements
        const pointsRequired = badge.requirements.points || 0;
        qualified = user.points >= pointsRequired;
        
        stats = { points: user.points };
        break;
    }
    
    return { qualified, stats };
  } catch (err) {
    console.error('Error checking badge qualification:', err);
    throw err;
  }
};

module.exports = mongoose.model('Badge', BadgeSchema);

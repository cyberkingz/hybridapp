const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LeaderboardSchema = new Schema({
  type: {
    type: String,
    enum: ['points', 'content', 'streams', 'coding'],
    required: true
  },
  timeframe: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'alltime'],
    required: true
  },
  entries: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    rank: {
      type: Number,
      required: true
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Static method to update leaderboard
LeaderboardSchema.statics.updateLeaderboard = async function(type, timeframe) {
  try {
    const User = mongoose.model('User');
    const Post = mongoose.model('Post');
    const Video = mongoose.model('Video');
    const Stream = mongoose.model('Stream');
    const CodeSession = mongoose.model('CodeSession');
    
    let users;
    let dateFilter = {};
    
    // Set date filter based on timeframe
    const now = new Date();
    if (timeframe === 'daily') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (timeframe === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (timeframe === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    }
    
    // Get scores based on leaderboard type
    let userScores = [];
    
    switch (type) {
      case 'points':
        // Get users sorted by points
        users = await User.find().sort({ points: -1 }).limit(100);
        userScores = users.map((user, index) => ({
          user: user._id,
          score: user.points,
          rank: index + 1
        }));
        break;
        
      case 'content':
        // Count posts and videos per user
        const postCounts = await Post.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$user', count: { $sum: 1 } } }
        ]);
        
        const videoCounts = await Video.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$user', count: { $sum: 1 } } }
        ]);
        
        // Combine counts
        const contentMap = new Map();
        
        postCounts.forEach(item => {
          contentMap.set(item._id.toString(), (contentMap.get(item._id.toString()) || 0) + item.count);
        });
        
        videoCounts.forEach(item => {
          contentMap.set(item._id.toString(), (contentMap.get(item._id.toString()) || 0) + item.count);
        });
        
        // Convert to array and sort
        userScores = Array.from(contentMap.entries())
          .map(([userId, count]) => ({ user: userId, score: count }))
          .sort((a, b) => b.score - a.score)
          .map((entry, index) => ({ ...entry, rank: index + 1 }))
          .slice(0, 100);
        break;
        
      case 'streams':
        // Count streams per user
        const streamCounts = await Stream.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$user', count: { $sum: 1 } } }
        ]);
        
        userScores = streamCounts
          .map(item => ({ user: item._id, score: item.count }))
          .sort((a, b) => b.score - a.score)
          .map((entry, index) => ({ ...entry, rank: index + 1 }))
          .slice(0, 100);
        break;
        
      case 'coding':
        // Count code sessions per user
        const codeCounts = await CodeSession.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$owner', count: { $sum: 1 } } }
        ]);
        
        userScores = codeCounts
          .map(item => ({ user: item._id, score: item.count }))
          .sort((a, b) => b.score - a.score)
          .map((entry, index) => ({ ...entry, rank: index + 1 }))
          .slice(0, 100);
        break;
    }
    
    // Find or create leaderboard
    let leaderboard = await this.findOne({ type, timeframe });
    
    if (!leaderboard) {
      leaderboard = new this({
        type,
        timeframe,
        entries: []
      });
    }
    
    // Update entries and last updated time
    leaderboard.entries = userScores;
    leaderboard.lastUpdated = new Date();
    
    await leaderboard.save();
    
    return leaderboard;
  } catch (err) {
    console.error('Error updating leaderboard:', err);
    throw err;
  }
};

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);

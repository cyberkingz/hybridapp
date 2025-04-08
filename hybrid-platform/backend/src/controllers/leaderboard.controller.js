const Leaderboard = require('../models/leaderboard.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

// @desc    Get leaderboard by type and timeframe
// @route   GET /api/leaderboards/:type/:timeframe
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const { type, timeframe } = req.params;
    
    // Validate type and timeframe
    if (!['points', 'content', 'streams', 'coding'].includes(type)) {
      return res.status(400).json({ message: 'Invalid leaderboard type' });
    }
    
    if (!['daily', 'weekly', 'monthly', 'alltime'].includes(timeframe)) {
      return res.status(400).json({ message: 'Invalid timeframe' });
    }
    
    // Find leaderboard
    let leaderboard = await Leaderboard.findOne({ type, timeframe })
      .populate('entries.user', 'username fullName avatar');
    
    // If leaderboard doesn't exist or is outdated, update it
    const now = new Date();
    const lastUpdated = leaderboard ? leaderboard.lastUpdated : null;
    
    let needsUpdate = !leaderboard;
    
    if (lastUpdated) {
      const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
      
      // Update if more than 1 hour for daily, 6 hours for weekly, 12 hours for monthly, 24 hours for alltime
      if (
        (timeframe === 'daily' && hoursSinceUpdate > 1) ||
        (timeframe === 'weekly' && hoursSinceUpdate > 6) ||
        (timeframe === 'monthly' && hoursSinceUpdate > 12) ||
        (timeframe === 'alltime' && hoursSinceUpdate > 24)
      ) {
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      leaderboard = await Leaderboard.updateLeaderboard(type, timeframe);
      await leaderboard.populate('entries.user', 'username fullName avatar');
    }
    
    res.json(leaderboard);
  } catch (err) {
    console.error('Error in getLeaderboard controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update all leaderboards
// @route   POST /api/leaderboards/update-all
// @access  Private/Admin
exports.updateAllLeaderboards = async (req, res) => {
  try {
    const types = ['points', 'content', 'streams', 'coding'];
    const timeframes = ['daily', 'weekly', 'monthly', 'alltime'];
    
    const results = [];
    
    for (const type of types) {
      for (const timeframe of timeframes) {
        const leaderboard = await Leaderboard.updateLeaderboard(type, timeframe);
        results.push({
          type,
          timeframe,
          entriesCount: leaderboard.entries.length,
          lastUpdated: leaderboard.lastUpdated
        });
      }
    }
    
    res.json({
      success: true,
      results
    });
  } catch (err) {
    console.error('Error in updateAllLeaderboards controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's rank in leaderboards
// @route   GET /api/leaderboards/user/:userId
// @access  Public
exports.getUserRanks = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const types = ['points', 'content', 'streams', 'coding'];
    const timeframes = ['daily', 'weekly', 'monthly', 'alltime'];
    
    const ranks = {};
    
    for (const type of types) {
      ranks[type] = {};
      
      for (const timeframe of timeframes) {
        const leaderboard = await Leaderboard.findOne({ type, timeframe });
        
        if (leaderboard) {
          const entry = leaderboard.entries.find(
            entry => entry.user.toString() === userId
          );
          
          if (entry) {
            ranks[type][timeframe] = {
              rank: entry.rank,
              score: entry.score
            };
          } else {
            ranks[type][timeframe] = null;
          }
        } else {
          ranks[type][timeframe] = null;
        }
      }
    }
    
    res.json({
      userId,
      username: user.username,
      ranks
    });
  } catch (err) {
    console.error('Error in getUserRanks controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

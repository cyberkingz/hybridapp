const User = require('../models/user.model');
const { validationResult } = require('express-validator');

// @desc    Follow a user
// @route   PUT /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res) => {
  try {
    // Check if user exists
    const userToFollow = await User.findById(req.params.id);
    
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is trying to follow themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    // Get current user
    const currentUser = await User.findById(req.user.id);
    
    // Check if already following
    if (currentUser.isFollowing(req.params.id)) {
      return res.status(400).json({ message: 'You are already following this user' });
    }
    
    // Add to following list of current user
    await currentUser.follow(req.params.id);
    
    // Add to followers list of target user
    await userToFollow.addFollower(req.user.id);
    
    res.json({
      following: currentUser.following,
      followers: userToFollow.followers
    });
  } catch (err) {
    console.error('Error in followUser controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unfollow a user
// @route   PUT /api/users/:id/unfollow
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    // Check if user exists
    const userToUnfollow = await User.findById(req.params.id);
    
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is trying to unfollow themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }
    
    // Get current user
    const currentUser = await User.findById(req.user.id);
    
    // Check if not following
    if (!currentUser.isFollowing(req.params.id)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }
    
    // Remove from following list of current user
    await currentUser.unfollow(req.params.id);
    
    // Remove from followers list of target user
    await userToUnfollow.removeFollower(req.user.id);
    
    res.json({
      following: currentUser.following,
      followers: userToUnfollow.followers
    });
  } catch (err) {
    console.error('Error in unfollowUser controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username fullName avatar bio');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.followers);
  } catch (err) {
    console.error('Error in getFollowers controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get users that a user is following
// @route   GET /api/users/:id/following
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username fullName avatar bio');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.following);
  } catch (err) {
    console.error('Error in getFollowing controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('badges');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error in getUserProfile controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fullName, bio, skills, avatar } = req.body;
    
    // Get user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (skills) user.skills = skills;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error('Error in updateProfile controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username fullName avatar bio')
      .limit(10);
    
    res.json(users);
  } catch (err) {
    console.error('Error in searchUsers controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

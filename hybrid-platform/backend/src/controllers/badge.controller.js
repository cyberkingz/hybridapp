const Badge = require('../models/badge.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const { validationResult } = require('express-validator');

// @desc    Create a new badge
// @route   POST /api/badges
// @access  Private/Admin
exports.createBadge = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, icon, category, pointsAwarded, requirements, level, isHidden } = req.body;

    // Create new badge
    const newBadge = new Badge({
      name,
      description,
      icon,
      category,
      pointsAwarded: pointsAwarded || 0,
      requirements,
      level: level || 1,
      isHidden: isHidden || false
    });

    const badge = await newBadge.save();

    res.status(201).json(badge);
  } catch (err) {
    console.error('Error in createBadge controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all badges
// @route   GET /api/badges
// @access  Public
exports.getBadges = async (req, res) => {
  try {
    const badges = await Badge.find({ isHidden: false }).sort({ level: 1, category: 1 });

    res.json(badges);
  } catch (err) {
    console.error('Error in getBadges controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single badge by ID
// @route   GET /api/badges/:id
// @access  Public
exports.getBadgeById = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);

    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    res.json(badge);
  } catch (err) {
    console.error('Error in getBadgeById controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a badge
// @route   PUT /api/badges/:id
// @access  Private/Admin
exports.updateBadge = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, icon, category, pointsAwarded, requirements, level, isHidden } = req.body;

    // Find badge
    const badge = await Badge.findById(req.params.id);

    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    // Update fields
    if (name) badge.name = name;
    if (description) badge.description = description;
    if (icon) badge.icon = icon;
    if (category) badge.category = category;
    if (pointsAwarded !== undefined) badge.pointsAwarded = pointsAwarded;
    if (requirements) badge.requirements = requirements;
    if (level) badge.level = level;
    if (isHidden !== undefined) badge.isHidden = isHidden;

    await badge.save();

    res.json(badge);
  } catch (err) {
    console.error('Error in updateBadge controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a badge
// @route   DELETE /api/badges/:id
// @access  Private/Admin
exports.deleteBadge = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);

    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    await badge.remove();

    res.json({ message: 'Badge removed' });
  } catch (err) {
    console.error('Error in deleteBadge controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if user qualifies for a badge
// @route   GET /api/badges/:id/check
// @access  Private
exports.checkBadgeQualification = async (req, res) => {
  try {
    const result = await Badge.checkQualification(req.user.id, req.params.id);

    res.json(result);
  } catch (err) {
    console.error('Error in checkBadgeQualification controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Badge or user not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Award a badge to a user
// @route   POST /api/badges/:id/award/:userId
// @access  Private/Admin
exports.awardBadge = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user already has this badge
    if (user.badges.includes(req.params.id)) {
      return res.status(400).json({ message: 'User already has this badge' });
    }
    
    // Add badge to user
    await user.addBadge(req.params.id);
    
    // Add points to user
    if (badge.pointsAwarded > 0) {
      await user.addPoints(badge.pointsAwarded);
    }
    
    // Create notification
    await Notification.createNotification({
      recipient: user._id,
      type: 'system',
      contentType: 'user',
      contentId: user._id,
      contentModel: 'User',
      message: `Congratulations! You've earned the "${badge.name}" badge and ${badge.pointsAwarded} points!`,
      url: `/profile/${user._id}`
    });
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error in awardBadge controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Badge or user not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check all badges for a user
// @route   GET /api/badges/check-all
// @access  Private
exports.checkAllBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('badges');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all badges
    const badges = await Badge.find();
    
    // Check each badge
    const results = [];
    const newlyQualifiedBadges = [];
    
    for (const badge of badges) {
      // Skip badges user already has
      if (user.badges.some(b => b._id.toString() === badge._id.toString())) {
        continue;
      }
      
      const result = await Badge.checkQualification(req.user.id, badge._id);
      
      if (result.qualified) {
        newlyQualifiedBadges.push(badge);
        
        // Add badge to user
        await user.addBadge(badge._id);
        
        // Add points to user
        if (badge.pointsAwarded > 0) {
          await user.addPoints(badge.pointsAwarded);
        }
        
        // Create notification
        await Notification.createNotification({
          recipient: user._id,
          type: 'system',
          contentType: 'user',
          contentId: user._id,
          contentModel: 'User',
          message: `Congratulations! You've earned the "${badge.name}" badge and ${badge.pointsAwarded} points!`,
          url: `/profile/${user._id}`
        });
      }
      
      results.push({
        badge,
        ...result
      });
    }
    
    res.json({
      results,
      newlyQualifiedBadges,
      user
    });
  } catch (err) {
    console.error('Error in checkAllBadges controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

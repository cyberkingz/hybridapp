const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', userController.getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    auth,
    [
      check('fullName', 'Full name cannot exceed 100 characters').optional().isLength({ max: 100 }),
      check('bio', 'Bio cannot exceed 500 characters').optional().isLength({ max: 500 })
    ]
  ],
  userController.updateProfile
);

// @route   PUT /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.put('/:id/follow', auth, userController.followUser);

// @route   PUT /api/users/:id/unfollow
// @desc    Unfollow a user
// @access  Private
router.put('/:id/unfollow', auth, userController.unfollowUser);

// @route   GET /api/users/:id/followers
// @desc    Get user's followers
// @access  Public
router.get('/:id/followers', userController.getFollowers);

// @route   GET /api/users/:id/following
// @desc    Get users that a user is following
// @access  Public
router.get('/:id/following', userController.getFollowing);

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', userController.searchUsers);

module.exports = router;

const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const badgeController = require('../controllers/badge.controller');

// @route   POST /api/badges
// @desc    Create a new badge
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    admin,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('icon', 'Icon is required').not().isEmpty(),
      check('category', 'Category is required').isIn(['content', 'social', 'coding', 'streaming', 'general']),
      check('requirements', 'Requirements is required').not().isEmpty()
    ]
  ],
  badgeController.createBadge
);

// @route   GET /api/badges
// @desc    Get all badges
// @access  Public
router.get('/', badgeController.getBadges);

// @route   GET /api/badges/:id
// @desc    Get a single badge by ID
// @access  Public
router.get('/:id', badgeController.getBadgeById);

// @route   PUT /api/badges/:id
// @desc    Update a badge
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    admin,
    [
      check('name', 'Name cannot be empty').optional().not().isEmpty(),
      check('description', 'Description cannot be empty').optional().not().isEmpty(),
      check('icon', 'Icon cannot be empty').optional().not().isEmpty(),
      check('category', 'Category must be valid').optional().isIn(['content', 'social', 'coding', 'streaming', 'general'])
    ]
  ],
  badgeController.updateBadge
);

// @route   DELETE /api/badges/:id
// @desc    Delete a badge
// @access  Private/Admin
router.delete('/:id', [auth, admin], badgeController.deleteBadge);

// @route   GET /api/badges/:id/check
// @desc    Check if user qualifies for a badge
// @access  Private
router.get('/:id/check', auth, badgeController.checkBadgeQualification);

// @route   POST /api/badges/:id/award/:userId
// @desc    Award a badge to a user
// @access  Private/Admin
router.post('/:id/award/:userId', [auth, admin], badgeController.awardBadge);

// @route   GET /api/badges/check-all
// @desc    Check all badges for a user
// @access  Private
router.get('/check-all', auth, badgeController.checkAllBadges);

module.exports = router;

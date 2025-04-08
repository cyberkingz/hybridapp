const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const leaderboardController = require('../controllers/leaderboard.controller');

// @route   GET /api/leaderboards/:type/:timeframe
// @desc    Get leaderboard by type and timeframe
// @access  Public
router.get('/:type/:timeframe', leaderboardController.getLeaderboard);

// @route   POST /api/leaderboards/update-all
// @desc    Update all leaderboards
// @access  Private/Admin
router.post('/update-all', [auth, admin], leaderboardController.updateAllLeaderboards);

// @route   GET /api/leaderboards/user/:userId
// @desc    Get user's rank in leaderboards
// @access  Public
router.get('/user/:userId', leaderboardController.getUserRanks);

module.exports = router;

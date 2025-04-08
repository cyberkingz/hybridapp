const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const { protect } = require('../middleware/auth.middleware');

// @route   GET /api/videos
// @desc    Get all videos
// @access  Public
router.get('/', videoController.getAllVideos);

// @route   GET /api/videos/:id
// @desc    Get video by ID
// @access  Public
router.get('/:id', videoController.getVideoById);

// @route   POST /api/videos
// @desc    Create a new video
// @access  Private
router.post('/', protect, videoController.createVideo);

// @route   PUT /api/videos/:id
// @desc    Update video
// @access  Private
router.put('/:id', protect, videoController.updateVideo);

// @route   DELETE /api/videos/:id
// @desc    Delete video
// @access  Private
router.delete('/:id', protect, videoController.deleteVideo);

// @route   POST /api/videos/:id/like
// @desc    Like a video
// @access  Private
router.post('/:id/like', protect, videoController.likeVideo);

// @route   POST /api/videos/:id/unlike
// @desc    Unlike a video
// @access  Private
router.post('/:id/unlike', protect, videoController.unlikeVideo);

// @route   POST /api/videos/:id/comment
// @desc    Comment on a video
// @access  Private
router.post('/:id/comment', protect, videoController.addComment);

// @route   GET /api/videos/:id/comments
// @desc    Get all comments for a video
// @access  Public
router.get('/:id/comments', videoController.getVideoComments);

// @route   GET /api/videos/trending
// @desc    Get trending videos
// @access  Public
router.get('/trending', videoController.getTrendingVideos);

// @route   GET /api/videos/recommended
// @desc    Get recommended videos for user
// @access  Private
router.get('/recommended', protect, videoController.getRecommendedVideos);

module.exports = router;

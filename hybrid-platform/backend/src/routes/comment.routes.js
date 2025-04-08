const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const commentController = require('../controllers/comment.controller');

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('content', 'Content is required').not().isEmpty(),
      check('content', 'Content cannot exceed 500 characters').isLength({ max: 500 }),
      check('contentType', 'Content type is required').isIn(['post', 'video', 'stream', 'code']),
      check('contentId', 'Content ID is required').not().isEmpty()
    ]
  ],
  commentController.createComment
);

// @route   GET /api/comments/:contentType/:contentId
// @desc    Get comments for a specific content
// @access  Public
router.get('/:contentType/:contentId', commentController.getComments);

// @route   GET /api/comments/:commentId/replies
// @desc    Get replies for a specific comment
// @access  Public
router.get('/:commentId/replies', commentController.getReplies);

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('content', 'Content is required').not().isEmpty(),
      check('content', 'Content cannot exceed 500 characters').isLength({ max: 500 })
    ]
  ],
  commentController.updateComment
);

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', auth, commentController.deleteComment);

// @route   PUT /api/comments/:id/like
// @desc    Like a comment
// @access  Private
router.put('/:id/like', auth, commentController.likeComment);

// @route   PUT /api/comments/:id/unlike
// @desc    Unlike a comment
// @access  Private
router.put('/:id/unlike', auth, commentController.unlikeComment);

module.exports = router;

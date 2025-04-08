const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const postController = require('../controllers/post.controller');

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('content', 'Content is required').not().isEmpty(),
      check('content', 'Content cannot exceed 1000 characters').isLength({ max: 1000 })
    ]
  ],
  postController.createPost
);

// @route   GET /api/posts
// @desc    Get all posts (with pagination)
// @access  Public
router.get('/', postController.getPosts);

// @route   GET /api/posts/tag/:tag
// @desc    Get posts by tag
// @access  Public
router.get('/tag/:tag', postController.getPostsByTag);

// @route   GET /api/posts/trending
// @desc    Get trending posts
// @access  Public
router.get('/trending', postController.getTrendingPosts);

// @route   GET /api/posts/feed
// @desc    Get posts from users that the current user follows
// @access  Private
router.get('/feed', auth, postController.getFeed);

// @route   GET /api/posts/:id
// @desc    Get a single post by ID
// @access  Public
router.get('/:id', postController.getPostById);

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('content', 'Content cannot exceed 1000 characters').isLength({ max: 1000 })
    ]
  ],
  postController.updatePost
);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, postController.deletePost);

// @route   PUT /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.put('/:id/like', auth, postController.likePost);

// @route   PUT /api/posts/:id/unlike
// @desc    Unlike a post
// @access  Private
router.put('/:id/unlike', auth, postController.unlikePost);

module.exports = router;

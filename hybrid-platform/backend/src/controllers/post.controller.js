const Post = require('../models/post.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { content, mediaUrls, tags } = req.body;

    const newPost = new Post({
      user: req.user.id,
      content,
      mediaUrls: mediaUrls || [],
      tags: tags || []
    });

    const post = await newPost.save();

    // Populate user data
    await post.populate('user', 'username fullName avatar');

    res.status(201).json(post);
  } catch (err) {
    console.error('Error in createPost controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all posts (with pagination)
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName avatar');

    const total = await Post.countDocuments();

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error in getPosts controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get posts by tag
// @route   GET /api/posts/tag/:tag
// @access  Public
exports.getPostsByTag = async (req, res) => {
  try {
    const tag = req.params.tag;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ tags: tag })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName avatar');

    const total = await Post.countDocuments({ tags: tag });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error in getPostsByTag controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get trending posts
// @route   GET /api/posts/trending
// @access  Public
exports.getTrendingPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const posts = await Post.findTrending(limit);
    
    // Populate user data
    const populatedPosts = await Post.populate(posts, {
      path: 'user',
      select: 'username fullName avatar'
    });

    res.json(populatedPosts);
  } catch (err) {
    console.error('Error in getTrendingPosts controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username fullName avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username fullName avatar'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error('Error in getPostById controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { content, mediaUrls, tags } = req.body;

    // Find post
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update fields
    post.content = content || post.content;
    post.mediaUrls = mediaUrls || post.mediaUrls;
    post.tags = tags || post.tags;

    await post.save();

    res.json(post);
  } catch (err) {
    console.error('Error in updatePost controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await post.remove();

    res.json({ message: 'Post removed' });
  } catch (err) {
    console.error('Error in deletePost controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the post has already been liked by this user
    if (post.likes.some(like => like.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Post already liked' });
    }

    await post.addLike(req.user.id);

    res.json(post.likes);
  } catch (err) {
    console.error('Error in likePost controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unlike a post
// @route   PUT /api/posts/:id/unlike
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the post has not been liked by this user
    if (!post.likes.some(like => like.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Post has not yet been liked' });
    }

    await post.removeLike(req.user.id);

    res.json(post.likes);
  } catch (err) {
    console.error('Error in unlikePost controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get posts from users that the current user follows
// @route   GET /api/posts/feed
// @access  Private
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get current user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all users that the current user follows
    const following = user.following;
    
    // Add current user's ID to include their posts in the feed
    following.push(user._id);

    // Get posts from followed users
    const posts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName avatar');

    const total = await Post.countDocuments({ user: { $in: following } });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error in getFeed controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

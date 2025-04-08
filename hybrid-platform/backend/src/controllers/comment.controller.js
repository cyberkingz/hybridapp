const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const Post = require('../models/post.model');
const Video = require('../models/video.model');
const Stream = require('../models/stream.model');
const CodeSession = require('../models/codeSession.model');
const { validationResult } = require('express-validator');

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
exports.createComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { content, contentType, contentId, parentId } = req.body;

    // Validate content exists
    let contentModel;
    let contentObj;
    
    switch (contentType) {
      case 'post':
        contentModel = 'Post';
        contentObj = await Post.findById(contentId);
        break;
      case 'video':
        contentModel = 'Video';
        contentObj = await Video.findById(contentId);
        break;
      case 'stream':
        contentModel = 'Stream';
        contentObj = await Stream.findById(contentId);
        break;
      case 'code':
        contentModel = 'CodeSession';
        contentObj = await CodeSession.findById(contentId);
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    if (!contentObj) {
      return res.status(404).json({ message: `${contentType} not found` });
    }

    // Create new comment
    const newComment = new Comment({
      user: req.user.id,
      content,
      contentType,
      contentId,
      contentModel,
      parentId: parentId || null
    });

    const comment = await newComment.save();

    // If this is a reply, add it to the parent comment
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (parentComment) {
        await parentComment.addReply(comment._id);
      }
    }

    // Add comment reference to the content
    await contentObj.addComment(comment._id);

    // Populate user data
    await comment.populate('user', 'username fullName avatar');

    res.status(201).json(comment);
  } catch (err) {
    console.error('Error in createComment controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comments for a specific content
// @route   GET /api/comments/:contentType/:contentId
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate content type
    if (!['post', 'video', 'stream', 'code'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    // Get top-level comments (no parentId)
    const comments = await Comment.find({
      contentType,
      contentId,
      parentId: null
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'user',
          select: 'username fullName avatar'
        }
      });

    const total = await Comment.countDocuments({
      contentType,
      contentId,
      parentId: null
    });

    res.json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalComments: total
    });
  } catch (err) {
    console.error('Error in getComments controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get replies for a specific comment
// @route   GET /api/comments/:commentId/replies
// @access  Public
exports.getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find the comment
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Get replies
    const replies = await Comment.find({
      parentId: commentId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName avatar');

    const total = await Comment.countDocuments({
      parentId: commentId
    });

    res.json({
      replies,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReplies: total
    });
  } catch (err) {
    console.error('Error in getReplies controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { content } = req.body;

    // Find comment
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update comment
    comment.content = content;
    comment.isEdited = true;

    await comment.save();

    res.json(comment);
  } catch (err) {
    console.error('Error in updateComment controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    // Find comment
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // If this is a reply, remove it from parent
    if (comment.parentId) {
      const parentComment = await Comment.findById(comment.parentId);
      if (parentComment) {
        await parentComment.removeReply(comment._id);
      }
    }

    // Remove comment from content
    let contentObj;
    switch (comment.contentType) {
      case 'post':
        contentObj = await Post.findById(comment.contentId);
        break;
      case 'video':
        contentObj = await Video.findById(comment.contentId);
        break;
      case 'stream':
        contentObj = await Stream.findById(comment.contentId);
        break;
      case 'code':
        contentObj = await CodeSession.findById(comment.contentId);
        break;
    }

    if (contentObj) {
      await contentObj.removeComment(comment._id);
    }

    // Delete all replies if this is a parent comment
    if (comment.replies.length > 0) {
      await Comment.deleteMany({ parentId: comment._id });
    }

    // Delete the comment
    await comment.remove();

    res.json({ message: 'Comment removed' });
  } catch (err) {
    console.error('Error in deleteComment controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like a comment
// @route   PUT /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the comment has already been liked by this user
    if (comment.likes.some(like => like.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Comment already liked' });
    }

    await comment.addLike(req.user.id);

    res.json(comment.likes);
  } catch (err) {
    console.error('Error in likeComment controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unlike a comment
// @route   PUT /api/comments/:id/unlike
// @access  Private
exports.unlikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the comment has not been liked by this user
    if (!comment.likes.some(like => like.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Comment has not yet been liked' });
    }

    await comment.removeLike(req.user.id);

    res.json(comment.likes);
  } catch (err) {
    console.error('Error in unlikeComment controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

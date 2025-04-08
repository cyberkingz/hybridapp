const Video = require('../models/video.model');
const User = require('../models/user.model');
const Comment = require('../models/comment.model');

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
exports.getAllVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name username avatar')
      .populate('comments.user', 'name username avatar');
    
    const total = await Video.countDocuments();
    
    res.json({
      videos,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error in getAllVideos:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get video by ID
// @route   GET /api/videos/:id
// @access  Public
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('user', 'name username avatar')
      .populate('comments.user', 'name username avatar');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Increment view count
    video.views += 1;
    await video.save();
    
    res.json(video);
  } catch (error) {
    console.error('Error in getVideoById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new video
// @route   POST /api/videos
// @access  Private
exports.createVideo = async (req, res) => {
  try {
    const { title, description, url, thumbnail, tags, category } = req.body;
    
    const newVideo = new Video({
      title,
      description,
      url,
      thumbnail,
      tags: tags.split(',').map(tag => tag.trim()),
      category,
      user: req.user.id
    });
    
    const video = await newVideo.save();
    
    // Add video to user's videos
    await User.findByIdAndUpdate(req.user.id, {
      $push: { videos: video._id }
    });
    
    res.status(201).json(video);
  } catch (error) {
    console.error('Error in createVideo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update video
// @route   PUT /api/videos/:id
// @access  Private
exports.updateVideo = async (req, res) => {
  try {
    const { title, description, thumbnail, tags, category } = req.body;
    
    let video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user owns the video
    if (video.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this video' });
    }
    
    const updatedVideo = {
      title: title || video.title,
      description: description || video.description,
      thumbnail: thumbnail || video.thumbnail,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : video.tags,
      category: category || video.category
    };
    
    video = await Video.findByIdAndUpdate(
      req.params.id,
      { $set: updatedVideo },
      { new: true }
    );
    
    res.json(video);
  } catch (error) {
    console.error('Error in updateVideo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user owns the video
    if (video.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this video' });
    }
    
    await video.remove();
    
    // Remove video from user's videos
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { videos: req.params.id }
    });
    
    res.json({ message: 'Video removed' });
  } catch (error) {
    console.error('Error in deleteVideo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like a video
// @route   POST /api/videos/:id/like
// @access  Private
exports.likeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if the video has already been liked by this user
    if (video.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Video already liked' });
    }
    
    // Remove from unlikes if it was unliked before
    if (video.unlikes.some(unlike => unlike.user.toString() === req.user.id)) {
      video.unlikes = video.unlikes.filter(
        unlike => unlike.user.toString() !== req.user.id
      );
    }
    
    video.likes.unshift({ user: req.user.id });
    
    await video.save();
    
    res.json(video.likes);
  } catch (error) {
    console.error('Error in likeVideo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unlike a video
// @route   POST /api/videos/:id/unlike
// @access  Private
exports.unlikeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if the video has already been unliked by this user
    if (video.unlikes.some(unlike => unlike.user.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Video already unliked' });
    }
    
    // Remove from likes if it was liked before
    if (video.likes.some(like => like.user.toString() === req.user.id)) {
      video.likes = video.likes.filter(
        like => like.user.toString() !== req.user.id
      );
    }
    
    video.unlikes.unshift({ user: req.user.id });
    
    await video.save();
    
    res.json(video.unlikes);
  } catch (error) {
    console.error('Error in unlikeVideo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add comment to video
// @route   POST /api/videos/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const newComment = new Comment({
      text,
      user: req.user.id,
      video: req.params.id
    });
    
    const comment = await newComment.save();
    
    // Add comment to video's comments
    video.comments.unshift(comment._id);
    await video.save();
    
    // Populate user info
    await comment.populate('user', 'name username avatar');
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error in addComment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all comments for a video
// @route   GET /api/videos/:id/comments
// @access  Public
exports.getVideoComments = async (req, res) => {
  try {
    const comments = await Comment.find({ video: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name username avatar');
    
    res.json(comments);
  } catch (error) {
    console.error('Error in getVideoComments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get trending videos
// @route   GET /api/videos/trending
// @access  Public
exports.getTrendingVideos = async (req, res) => {
  try {
    const videos = await Video.find()
      .sort({ views: -1, likes: -1 })
      .limit(10)
      .populate('user', 'name username avatar');
    
    res.json(videos);
  } catch (error) {
    console.error('Error in getTrendingVideos:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get recommended videos for user
// @route   GET /api/videos/recommended
// @access  Private
exports.getRecommendedVideos = async (req, res) => {
  try {
    // Get user's interests and watched videos
    const user = await User.findById(req.user.id);
    
    // Find videos that match user interests or are popular
    const videos = await Video.find({
      $or: [
        { tags: { $in: user.interests } },
        { category: { $in: user.preferredCategories } },
        { views: { $gt: 100 } }
      ],
      _id: { $nin: user.watchedVideos }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name username avatar');
    
    res.json(videos);
  } catch (error) {
    console.error('Error in getRecommendedVideos:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

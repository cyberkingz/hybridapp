const Stream = require('../models/stream.model');
const User = require('../models/user.model');
const CodeSession = require('../models/codeSession.model');
const { validationResult } = require('express-validator');

// @desc    Create a new stream
// @route   POST /api/streams
// @access  Private
exports.createStream = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, tags, scheduledFor } = req.body;

    const newStream = new Stream({
      user: req.user.id,
      title,
      description,
      tags: tags || [],
      status: scheduledFor ? 'scheduled' : 'live',
      startedAt: scheduledFor ? null : new Date()
    });

    const stream = await newStream.save();

    // Populate user data
    await stream.populate('user', 'username fullName avatar');

    res.status(201).json(stream);
  } catch (err) {
    console.error('Error in createStream controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all active streams
// @route   GET /api/streams/active
// @access  Public
exports.getActiveStreams = async (req, res) => {
  try {
    const streams = await Stream.find({ status: 'live' })
      .sort({ startedAt: -1 })
      .populate('user', 'username fullName avatar');

    res.json(streams);
  } catch (err) {
    console.error('Error in getActiveStreams controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get streams by tag
// @route   GET /api/streams/tag/:tag
// @access  Public
exports.getStreamsByTag = async (req, res) => {
  try {
    const tag = req.params.tag;
    
    const streams = await Stream.find({ 
      tags: tag,
      status: { $in: ['scheduled', 'live'] }
    })
      .sort({ status: 1, startedAt: -1 })
      .populate('user', 'username fullName avatar');

    res.json(streams);
  } catch (err) {
    console.error('Error in getStreamsByTag controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single stream by ID
// @route   GET /api/streams/:id
// @access  Public
exports.getStreamById = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id)
      .populate('user', 'username fullName avatar')
      .populate('codeSessions');

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    res.json(stream);
  } catch (err) {
    console.error('Error in getStreamById controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Stream not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a stream
// @route   PUT /api/streams/:id
// @access  Private
exports.updateStream = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, tags } = req.body;

    // Find stream
    const stream = await Stream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Check user
    if (stream.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update fields
    stream.title = title || stream.title;
    stream.description = description || stream.description;
    stream.tags = tags || stream.tags;

    await stream.save();

    res.json(stream);
  } catch (err) {
    console.error('Error in updateStream controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Stream not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Start a stream
// @route   PUT /api/streams/:id/start
// @access  Private
exports.startStream = async (req, res) => {
  try {
    // Find stream
    const stream = await Stream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Check user
    if (stream.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Check if already live
    if (stream.status === 'live') {
      return res.status(400).json({ message: 'Stream is already live' });
    }

    // Start stream
    await stream.startStream();

    res.json(stream);
  } catch (err) {
    console.error('Error in startStream controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Stream not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    End a stream
// @route   PUT /api/streams/:id/end
// @access  Private
exports.endStream = async (req, res) => {
  try {
    // Find stream
    const stream = await Stream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Check user
    if (stream.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Check if not live
    if (stream.status !== 'live') {
      return res.status(400).json({ message: 'Stream is not live' });
    }

    // End stream
    await stream.endStream();

    // Update with recording URL if provided
    if (req.body.recordingUrl) {
      stream.recordingUrl = req.body.recordingUrl;
      await stream.save();
    }

    res.json(stream);
  } catch (err) {
    console.error('Error in endStream controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Stream not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a code session for a stream
// @route   POST /api/streams/:id/code
// @access  Private
exports.createCodeSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, language, initialCode } = req.body;

    // Find stream
    const stream = await Stream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Check user
    if (stream.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Create code session
    const newCodeSession = new CodeSession({
      stream: stream._id,
      title,
      language,
      codeContent: initialCode || '',
      owner: req.user.id
    });

    const codeSession = await newCodeSession.save();

    // Add code session to stream
    await stream.addCodeSession(codeSession._id);

    res.status(201).json(codeSession);
  } catch (err) {
    console.error('Error in createCodeSession controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Stream not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get WebRTC signaling information
// @route   POST /api/streams/:id/signal
// @access  Private
exports.handleSignaling = async (req, res) => {
  try {
    const { signal, targetUserId } = req.body;

    // Validate request
    if (!signal) {
      return res.status(400).json({ message: 'Signal data is required' });
    }

    // Find stream
    const stream = await Stream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Check if stream is live
    if (stream.status !== 'live') {
      return res.status(400).json({ message: 'Stream is not live' });
    }

    // Create signal object
    const signalData = {
      signal,
      from: req.user.id,
      fromUsername: req.user.username,
      to: targetUserId,
      streamId: stream._id,
      timestamp: new Date()
    };

    // In a real implementation, this would be sent through socket.io
    // For now, we'll just return the signal data
    res.json(signalData);
  } catch (err) {
    console.error('Error in handleSignaling controller:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Stream not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

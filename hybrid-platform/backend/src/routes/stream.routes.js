const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const streamController = require('../controllers/stream.controller');

// @route   POST /api/streams
// @desc    Create a new stream
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('title', 'Title cannot exceed 100 characters').isLength({ max: 100 })
    ]
  ],
  streamController.createStream
);

// @route   GET /api/streams/active
// @desc    Get all active streams
// @access  Public
router.get('/active', streamController.getActiveStreams);

// @route   GET /api/streams/tag/:tag
// @desc    Get streams by tag
// @access  Public
router.get('/tag/:tag', streamController.getStreamsByTag);

// @route   GET /api/streams/:id
// @desc    Get a single stream by ID
// @access  Public
router.get('/:id', streamController.getStreamById);

// @route   PUT /api/streams/:id
// @desc    Update a stream
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('title', 'Title cannot exceed 100 characters').isLength({ max: 100 })
    ]
  ],
  streamController.updateStream
);

// @route   PUT /api/streams/:id/start
// @desc    Start a stream
// @access  Private
router.put('/:id/start', auth, streamController.startStream);

// @route   PUT /api/streams/:id/end
// @desc    End a stream
// @access  Private
router.put('/:id/end', auth, streamController.endStream);

// @route   POST /api/streams/:id/code
// @desc    Create a code session for a stream
// @access  Private
router.post(
  '/:id/code',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('language', 'Language is required').not().isEmpty()
    ]
  ],
  streamController.createCodeSession
);

// @route   POST /api/streams/:id/signal
// @desc    Handle WebRTC signaling
// @access  Private
router.post('/:id/signal', auth, streamController.handleSignaling);

module.exports = router;

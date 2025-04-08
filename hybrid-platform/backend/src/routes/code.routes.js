const express = require('express');
const router = express.Router();
const codeController = require('../controllers/code.controller');
const { protect } = require('../middleware/auth.middleware');

// @route   GET /api/code/sessions
// @desc    Get all code sessions
// @access  Public
router.get('/sessions', codeController.getAllSessions);

// @route   GET /api/code/sessions/:id
// @desc    Get code session by ID
// @access  Public
router.get('/sessions/:id', codeController.getSessionById);

// @route   POST /api/code/sessions
// @desc    Create a new code session
// @access  Private
router.post('/sessions', protect, codeController.createSession);

// @route   PUT /api/code/sessions/:id
// @desc    Update code session
// @access  Private
router.put('/sessions/:id', protect, codeController.updateSession);

// @route   DELETE /api/code/sessions/:id
// @desc    Delete code session
// @access  Private
router.delete('/sessions/:id', protect, codeController.deleteSession);

// @route   POST /api/code/sessions/:id/join
// @desc    Join a code session
// @access  Private
router.post('/sessions/:id/join', protect, codeController.joinSession);

// @route   POST /api/code/sessions/:id/leave
// @desc    Leave a code session
// @access  Private
router.post('/sessions/:id/leave', protect, codeController.leaveSession);

// @route   POST /api/code/sessions/:id/save
// @desc    Save code from a session
// @access  Private
router.post('/sessions/:id/save', protect, codeController.saveCode);

// @route   POST /api/code/execute
// @desc    Execute code
// @access  Private
router.post('/execute', protect, codeController.executeCode);

// @route   GET /api/code/templates
// @desc    Get code templates
// @access  Public
router.get('/templates', codeController.getTemplates);

module.exports = router;

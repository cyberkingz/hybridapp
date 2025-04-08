const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const sharingService = require('../services/sharing.service');

// @route   GET /api/share/:contentType/:contentId
// @desc    Get sharing links for content
// @access  Public
router.get('/:contentType/:contentId', async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    
    const links = await sharingService.generateSharingLinks(contentType, contentId);
    
    res.json(links);
  } catch (err) {
    console.error('Error getting sharing links:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST /api/share/:contentType/:contentId/:platform
// @desc    Record share event
// @access  Private
router.post('/:contentType/:contentId/:platform', auth, async (req, res) => {
  try {
    const { contentType, contentId, platform } = req.params;
    
    const result = await sharingService.recordShare(
      req.user.id,
      contentType,
      contentId,
      platform
    );
    
    res.json(result);
  } catch (err) {
    console.error('Error recording share:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;

// Service for handling social sharing functionality
const Post = require('../models/post.model');
const Video = require('../models/video.model');
const Stream = require('../models/stream.model');
const CodeSession = require('../models/codeSession.model');
const Notification = require('../models/notification.model');

class SharingService {
  constructor() {
    // Define supported platforms
    this.platforms = ['twitter', 'facebook', 'linkedin', 'reddit', 'email'];
    
    // Define content types
    this.contentTypes = ['post', 'video', 'stream', 'code'];
    
    // Base URL for sharing
    this.baseUrl = process.env.CLIENT_URL || 'https://hybrid-platform.example.com';
  }
  
  // Generate sharing URL for content
  generateSharingUrl(contentType, contentId) {
    if (!this.contentTypes.includes(contentType)) {
      throw new Error('Invalid content type');
    }
    
    let path;
    switch (contentType) {
      case 'post':
        path = 'posts';
        break;
      case 'video':
        path = 'videos';
        break;
      case 'stream':
        path = 'streams';
        break;
      case 'code':
        path = 'code';
        break;
    }
    
    return `${this.baseUrl}/${path}/${contentId}`;
  }
  
  // Generate sharing text for content
  async generateSharingText(contentType, contentId) {
    if (!this.contentTypes.includes(contentType)) {
      throw new Error('Invalid content type');
    }
    
    let content;
    let title;
    let username;
    
    try {
      switch (contentType) {
        case 'post':
          content = await Post.findById(contentId).populate('user', 'username');
          title = content.content.substring(0, 50) + (content.content.length > 50 ? '...' : '');
          username = content.user.username;
          break;
        case 'video':
          content = await Video.findById(contentId).populate('user', 'username');
          title = content.title;
          username = content.user.username;
          break;
        case 'stream':
          content = await Stream.findById(contentId).populate('user', 'username');
          title = content.title;
          username = content.user.username;
          break;
        case 'code':
          content = await CodeSession.findById(contentId).populate('user', 'username');
          title = content.title;
          username = content.user.username;
          break;
      }
      
      if (!content) {
        throw new Error('Content not found');
      }
      
      return `Check out "${title}" by @${username} on Hybrid Platform`;
    } catch (err) {
      console.error('Error generating sharing text:', err);
      throw err;
    }
  }
  
  // Generate sharing links for all platforms
  async generateSharingLinks(contentType, contentId) {
    try {
      const url = this.generateSharingUrl(contentType, contentId);
      const text = await this.generateSharingText(contentType, contentId);
      const encodedUrl = encodeURIComponent(url);
      const encodedText = encodeURIComponent(text);
      
      const links = {
        url,
        text,
        platforms: {}
      };
      
      // Twitter
      links.platforms.twitter = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      
      // Facebook
      links.platforms.facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      
      // LinkedIn
      links.platforms.linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      
      // Reddit
      links.platforms.reddit = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
      
      // Email
      links.platforms.email = `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`;
      
      return links;
    } catch (err) {
      console.error('Error generating sharing links:', err);
      throw err;
    }
  }
  
  // Record share event
  async recordShare(userId, contentType, contentId, platform) {
    try {
      if (!this.contentTypes.includes(contentType)) {
        throw new Error('Invalid content type');
      }
      
      if (!this.platforms.includes(platform)) {
        throw new Error('Invalid platform');
      }
      
      let content;
      let contentModel;
      let contentOwner;
      
      switch (contentType) {
        case 'post':
          content = await Post.findById(contentId);
          contentModel = 'Post';
          break;
        case 'video':
          content = await Video.findById(contentId);
          contentModel = 'Video';
          break;
        case 'stream':
          content = await Stream.findById(contentId);
          contentModel = 'Stream';
          break;
        case 'code':
          content = await CodeSession.findById(contentId);
          contentModel = 'CodeSession';
          break;
      }
      
      if (!content) {
        throw new Error('Content not found');
      }
      
      contentOwner = content.user.toString();
      
      // Create notification for content owner if it's not the same user
      if (userId !== contentOwner) {
        await Notification.createNotification({
          recipient: contentOwner,
          sender: userId,
          type: 'share',
          contentType,
          contentId,
          contentModel,
          message: `Someone shared your ${contentType} on ${platform}`,
          url: this.generateSharingUrl(contentType, contentId)
        });
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error recording share:', err);
      throw err;
    }
  }
}

module.exports = new SharingService();

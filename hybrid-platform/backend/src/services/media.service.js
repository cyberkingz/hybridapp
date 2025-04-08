// Media service for handling video uploads and streaming
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const Stream = require('../models/stream.model');
const Video = require('../models/video.model');

class MediaService {
  constructor() {
    // Configure AWS SDK
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.s3 = new AWS.S3();
    this.cloudfront = new AWS.CloudFront();
    
    // S3 bucket names
    this.videoBucket = process.env.S3_VIDEO_BUCKET || 'hybrid-platform-videos';
    this.thumbnailBucket = process.env.S3_THUMBNAIL_BUCKET || 'hybrid-platform-thumbnails';
    
    // CloudFront distribution IDs
    this.videoDistribution = process.env.CLOUDFRONT_VIDEO_DISTRIBUTION;
    this.thumbnailDistribution = process.env.CLOUDFRONT_THUMBNAIL_DISTRIBUTION;
    
    // CloudFront domain names
    this.videoDomain = process.env.CLOUDFRONT_VIDEO_DOMAIN || 'videos.example.com';
    this.thumbnailDomain = process.env.CLOUDFRONT_THUMBNAIL_DOMAIN || 'thumbnails.example.com';
    
    // Local storage paths for temporary files
    this.tempDir = process.env.TEMP_DIR || '/tmp';
  }
  
  // Upload video to S3
  async uploadVideo(file, userId) {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${userId}/${uuidv4()}${fileExtension}`;
      
      const params = {
        Bucket: this.videoBucket,
        Key: fileName,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype
      };
      
      const uploadResult = await this.s3.upload(params).promise();
      
      // Clean up temp file
      fs.unlinkSync(file.path);
      
      // Return video URL
      return {
        url: `https://${this.videoDomain}/${fileName}`,
        key: fileName
      };
    } catch (err) {
      console.error('Error uploading video to S3:', err);
      throw err;
    }
  }
  
  // Upload thumbnail to S3
  async uploadThumbnail(file, userId) {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${userId}/${uuidv4()}${fileExtension}`;
      
      const params = {
        Bucket: this.thumbnailBucket,
        Key: fileName,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype
      };
      
      const uploadResult = await this.s3.upload(params).promise();
      
      // Clean up temp file
      fs.unlinkSync(file.path);
      
      // Return thumbnail URL
      return {
        url: `https://${this.thumbnailDomain}/${fileName}`,
        key: fileName
      };
    } catch (err) {
      console.error('Error uploading thumbnail to S3:', err);
      throw err;
    }
  }
  
  // Generate signed URL for video upload
  async getSignedUploadUrl(userId, fileType) {
    try {
      const fileName = `${userId}/${uuidv4()}`;
      
      const params = {
        Bucket: this.videoBucket,
        Key: fileName,
        ContentType: fileType,
        Expires: 3600 // URL expires in 1 hour
      };
      
      const signedUrl = await this.s3.getSignedUrlPromise('putObject', params);
      
      return {
        signedUrl,
        fileKey: fileName,
        videoUrl: `https://${this.videoDomain}/${fileName}`
      };
    } catch (err) {
      console.error('Error generating signed URL:', err);
      throw err;
    }
  }
  
  // Create HLS streaming manifest for video
  async createHlsManifest(videoKey, videoId) {
    try {
      // In a real implementation, this would trigger a video transcoding job
      // For this example, we'll just create a mock manifest
      
      const manifestKey = `${path.dirname(videoKey)}/hls/${path.basename(videoKey, path.extname(videoKey))}/manifest.m3u8`;
      
      const manifestContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8`;
      
      const params = {
        Bucket: this.videoBucket,
        Key: manifestKey,
        Body: manifestContent,
        ContentType: 'application/x-mpegURL'
      };
      
      await this.s3.putObject(params).promise();
      
      // Update video with HLS URL
      await Video.findByIdAndUpdate(videoId, {
        hlsUrl: `https://${this.videoDomain}/${manifestKey}`
      });
      
      return {
        hlsUrl: `https://${this.videoDomain}/${manifestKey}`
      };
    } catch (err) {
      console.error('Error creating HLS manifest:', err);
      throw err;
    }
  }
  
  // Record live stream to video
  async recordStream(streamId, userId) {
    try {
      // Find stream
      const stream = await Stream.findById(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }
      
      // Check if user is stream owner
      if (stream.user.toString() !== userId) {
        throw new Error('Only stream owner can record stream');
      }
      
      // In a real implementation, this would start a recording job
      // For this example, we'll just create a mock recording
      
      const recordingKey = `${userId}/recordings/${streamId}.mp4`;
      const thumbnailKey = `${userId}/thumbnails/${streamId}.jpg`;
      
      // Create a new video entry
      const video = new Video({
        user: userId,
        title: stream.title,
        description: stream.description,
        videoUrl: `https://${this.videoDomain}/${recordingKey}`,
        thumbnailUrl: `https://${this.thumbnailDomain}/${thumbnailKey}`,
        duration: 0, // Will be updated after processing
        tags: stream.tags
      });
      
      await video.save();
      
      // Update stream with recording URL
      stream.recordingUrl = `https://${this.videoDomain}/${recordingKey}`;
      await stream.save();
      
      // Create HLS manifest for the recording
      await this.createHlsManifest(recordingKey, video._id);
      
      return {
        videoId: video._id,
        videoUrl: video.videoUrl,
        hlsUrl: `https://${this.videoDomain}/${path.dirname(recordingKey)}/hls/${path.basename(recordingKey, '.mp4')}/manifest.m3u8`
      };
    } catch (err) {
      console.error('Error recording stream:', err);
      throw err;
    }
  }
  
  // Get video streaming URL
  async getVideoStreamUrl(videoId) {
    try {
      const video = await Video.findById(videoId);
      
      if (!video) {
        throw new Error('Video not found');
      }
      
      // Return HLS URL if available, otherwise regular video URL
      return {
        streamUrl: video.hlsUrl || video.videoUrl,
        isHls: !!video.hlsUrl
      };
    } catch (err) {
      console.error('Error getting video stream URL:', err);
      throw err;
    }
  }
}

module.exports = new MediaService();

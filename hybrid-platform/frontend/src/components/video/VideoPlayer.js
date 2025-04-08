import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, Slider, Grid, Paper, Card, CardContent, Avatar, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import SettingsIcon from '@mui/icons-material/Settings';
import 'video.js/dist/video-js.css';

// In a real implementation, we would use video.js or a similar library
// This is a simplified custom video player for demonstration purposes
const VideoPlayer = ({ videoUrl, title, poster, onEnded }) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('auto');
  
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  
  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      // Set up event listeners
      const onLoadedMetadata = () => {
        setDuration(video.duration);
      };
      
      const onTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };
      
      const onEnded = () => {
        setPlaying(false);
        if (onEnded) onEnded();
      };
      
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('ended', onEnded);
      
      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('ended', onEnded);
      };
    }
  }, [onEnded]);
  
  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      if (playing) {
        video.play().catch(error => {
          console.error('Error playing video:', error);
          setPlaying(false);
        });
      } else {
        video.pause();
      }
    }
  }, [playing]);
  
  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      video.volume = volume;
      video.muted = muted;
    }
  }, [volume, muted]);
  
  const handlePlayPause = () => {
    setPlaying(!playing);
  };
  
  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    if (newValue === 0) {
      setMuted(true);
    } else {
      setMuted(false);
    }
  };
  
  const handleMuteToggle = () => {
    setMuted(!muted);
  };
  
  const handleSeek = (event, newValue) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };
  
  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };
  
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
  };
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const qualityOptions = ['auto', '1080p', '720p', '480p', '360p'];
  
  return (
    <Box 
      sx={{ 
        position: 'relative', 
        width: '100%', 
        bgcolor: 'black',
        borderRadius: 2,
        overflow: 'hidden',
        '&:hover': {
          '& .video-controls': {
            opacity: 1,
          }
        }
      }}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        style={{ width: '100%', display: 'block' }}
        onClick={handlePlayPause}
        playsInline
      />
      
      <Box 
        className="video-controls"
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          bgcolor: 'rgba(0, 0, 0, 0.7)', 
          p: 1,
          transition: 'opacity 0.3s',
          opacity: showControls ? 1 : 0,
        }}
      >
        <Grid container alignItems="center" spacing={1}>
          <Grid item>
            <IconButton 
              size="small" 
              onClick={handlePlayPause} 
              sx={{ color: 'white' }}
            >
              {playing ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Grid>
          
          <Grid item xs>
            <Slider
              value={currentTime}
              min={0}
              max={duration || 100}
              onChange={handleSeek}
              sx={{ 
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: 'none',
                  }
                },
                '& .MuiSlider-rail': {
                  opacity: 0.5,
                }
              }}
            />
          </Grid>
          
          <Grid item>
            <Typography variant="caption" sx={{ color: 'white', mx: 1 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </Grid>
          
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', width: 100 }}>
              <IconButton 
                size="small" 
                onClick={handleMuteToggle} 
                sx={{ color: 'white' }}
              >
                {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
              <Slider
                value={muted ? 0 : volume}
                min={0}
                max={1}
                step={0.01}
                onChange={handleVolumeChange}
                sx={{ 
                  ml: 1,
                  color: 'primary.main',
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                  }
                }}
              />
            </Box>
          </Grid>
          
          <Grid item>
            <Tooltip title="Quality">
              <IconButton 
                size="small" 
                sx={{ color: 'white' }}
                onClick={() => {
                  // In a real app, this would open a quality selection menu
                  const nextQualityIndex = (qualityOptions.indexOf(quality) + 1) % qualityOptions.length;
                  setQuality(qualityOptions[nextQualityIndex]);
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          
          <Grid item>
            <Tooltip title="Fullscreen">
              <IconButton 
                size="small" 
                onClick={handleFullscreen} 
                sx={{ color: 'white' }}
              >
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

// Video details component to display below the player
const VideoDetails = ({ title, username, views, timestamp, likes, comments, shares, description, tags }) => {
  return (
    <Card sx={{ mt: 2, mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h5" component="h1" gutterBottom>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 1 }} />
          <Box>
            <Typography variant="subtitle1">{username}</Typography>
            <Typography variant="body2" color="text.secondary">
              {views} views • {timestamp}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Typography>❤️ {likes}</Typography>
          <Typography>💬 {comments}</Typography>
          <Typography>🔄 {shares}</Typography>
          <Typography>🔖</Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          {description}
        </Typography>
        
        <Box>
          {tags.map((tag, index) => (
            <Typography 
              key={index} 
              component="span" 
              color="primary" 
              sx={{ mr: 1 }}
            >
              #{tag}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Comments section component
const CommentsSection = ({ comments, totalComments }) => {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Comments ({totalComments})
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Avatar sx={{ mr: 1 }} />
          <Box sx={{ flexGrow: 1 }}>
            <input 
              type="text" 
              placeholder="Add a comment..." 
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                fontSize: '14px'
              }} 
            />
          </Box>
        </Box>
      </Box>
      
      {comments.map((comment, index) => (
        <Box key={index} sx={{ display: 'flex', mb: 2 }}>
          <Avatar sx={{ mr: 1 }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ mr: 1 }}>
                {comment.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                • {comment.timestamp}
              </Typography>
            </Box>
            <Typography variant="body2" paragraph>
              {comment.content}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2">❤️ {comment.likes}</Typography>
              <Typography variant="body2" sx={{ cursor: 'pointer' }}>💬 Reply</Typography>
            </Box>
          </Box>
        </Box>
      ))}
      
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography 
          variant="button" 
          color="primary" 
          sx={{ cursor: 'pointer' }}
        >
          Load more comments...
        </Typography>
      </Box>
    </Paper>
  );
};

// Complete video page component
const VideoPlayerPage = () => {
  // Mock data
  const videoData = {
    id: 1,
    title: 'Building a Neural Network from Scratch',
    url: 'https://example.com/video.mp4', // This would be a real video URL in production
    poster: 'https://example.com/thumbnail.jpg',
    username: 'airesearcher',
    views: '10K',
    timestamp: '2 days ago',
    likes: 532,
    comments: 78,
    shares: 124,
    description: 'In this tutorial, I walk through how to build a simple neural network using only NumPy. Perfect for beginners who want to understand the fundamentals of deep learning.',
    tags: ['DeepLearning', 'Python', 'Tutorial']
  };
  
  const commentData = [
    {
      id: 1,
      username: 'pythonlover',
      timestamp: '1 day ago',
      content: 'This was super helpful! I\'ve been struggling with backpropagation and this made it click. Thanks!',
      likes: 24
    },
    {
      id: 2,
      username: 'mlexpert',
      timestamp: '2 days ago',
      content: 'Have you considered using JAX instead of NumPy for better performance?',
      likes: 8
    }
  ];
  
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%', py: 2 }}>
      <VideoPlayer 
        videoUrl={videoData.url}
        poster={videoData.poster}
        title={videoData.title}
      />
      
      <VideoDetails 
        title={videoData.title}
        username={videoData.username}
        views={videoData.views}
        timestamp={videoData.timestamp}
        likes={videoData.likes}
        comments={videoData.comments}
        shares={videoData.shares}
        description={videoData.description}
        tags={videoData.tags}
      />
      
      <CommentsSection 
        comments={commentData}
        totalComments={videoData.comments}
      />
    </Box>
  );
};

export default VideoPlayerPage;

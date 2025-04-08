import React from 'react';
import { Box, Typography, Avatar, Button, Paper, Grid, Divider, Tabs, Tab } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

// Profile page component
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Mock data for user content
  const userPosts = [
    { id: 1, title: 'Getting Started with React Hooks', date: '2 days ago', likes: 24, comments: 5 },
    { id: 2, title: 'Building a Neural Network from Scratch', date: '1 week ago', likes: 56, comments: 12 },
    { id: 3, title: 'The Future of AI in Web Development', date: '2 weeks ago', likes: 89, comments: 34 }
  ];

  const userVideos = [
    { id: 1, title: 'React Performance Optimization', duration: '15:24', views: '1.2K', date: '3 days ago' },
    { id: 2, title: 'Building a GPT-3 Powered Chatbot', duration: '22:18', views: '3.5K', date: '1 week ago' }
  ];

  const userStreams = [
    { id: 1, title: 'Live Coding: Building a Twitter Clone', date: '1 day ago', viewers: 78 },
    { id: 2, title: 'Q&A: Machine Learning Career Advice', date: '2 weeks ago', viewers: 156 }
  ];

  const userBadges = [
    { id: 1, name: 'Code Master', description: 'Completed 10 coding sessions', icon: '🏆' },
    { id: 2, name: 'Stream Star', description: 'Reached 100 viewers in a stream', icon: '⭐' },
    { id: 3, name: 'Content Creator', description: 'Published 5 videos', icon: '📹' }
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={2}>
            <Avatar
              sx={{ width: 120, height: 120, mx: { xs: 'auto', md: 0 } }}
              src={user?.avatar || '/default-avatar.png'}
              alt={user?.username}
            />
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Typography variant="h4" gutterBottom>
              {user?.fullName || 'User Name'}
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              @{user?.username || 'username'}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {user?.bio || 'No bio provided yet.'}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {user?.skills?.map((skill, index) => (
                <Typography key={index} variant="body2" component="span" sx={{ 
                  bgcolor: 'primary.light', 
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1
                }}>
                  {skill}
                </Typography>
              )) || 'No skills listed'}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button 
                variant="contained" 
                component={RouterLink} 
                to="/profile/edit"
                fullWidth
              >
                Edit Profile
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={logout}
                fullWidth
              >
                Logout
              </Button>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {user?.followers?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Followers
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {user?.following?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Following
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {user?.points || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Points
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Badges Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Badges & Achievements
        </Typography>
        
        <Grid container spacing={2}>
          {userBadges.map(badge => (
            <Grid item xs={6} sm={4} md={3} key={badge.id}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {badge.icon}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  {badge.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {badge.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
      
      {/* Content Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Posts" />
          <Tab label="Videos" />
          <Tab label="Streams" />
          <Tab label="Activity" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Posts Tab */}
          {tabValue === 0 && (
            <Box>
              {userPosts.length > 0 ? (
                userPosts.map(post => (
                  <Paper 
                    key={post.id} 
                    sx={{ p: 2, mb: 2, '&:last-child': { mb: 0 } }}
                    variant="outlined"
                  >
                    <Typography variant="h6" component={RouterLink} to={`/posts/${post.id}`} sx={{ 
                      textDecoration: 'none',
                      color: 'text.primary',
                      '&:hover': { color: 'primary.main' }
                    }}>
                      {post.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Posted {post.date} • {post.likes} likes • {post.comments} comments
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No posts yet
                </Typography>
              )}
            </Box>
          )}
          
          {/* Videos Tab */}
          {tabValue === 1 && (
            <Box>
              {userVideos.length > 0 ? (
                userVideos.map(video => (
                  <Paper 
                    key={video.id} 
                    sx={{ p: 2, mb: 2, '&:last-child': { mb: 0 } }}
                    variant="outlined"
                  >
                    <Typography variant="h6" component={RouterLink} to={`/videos/${video.id}`} sx={{ 
                      textDecoration: 'none',
                      color: 'text.primary',
                      '&:hover': { color: 'primary.main' }
                    }}>
                      {video.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {video.duration} • {video.views} views • {video.date}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No videos yet
                </Typography>
              )}
            </Box>
          )}
          
          {/* Streams Tab */}
          {tabValue === 2 && (
            <Box>
              {userStreams.length > 0 ? (
                userStreams.map(stream => (
                  <Paper 
                    key={stream.id} 
                    sx={{ p: 2, mb: 2, '&:last-child': { mb: 0 } }}
                    variant="outlined"
                  >
                    <Typography variant="h6" component={RouterLink} to={`/streams/${stream.id}`} sx={{ 
                      textDecoration: 'none',
                      color: 'text.primary',
                      '&:hover': { color: 'primary.main' }
                    }}>
                      {stream.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Streamed {stream.date} • {stream.viewers} viewers
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No streams yet
                </Typography>
              )}
            </Box>
          )}
          
          {/* Activity Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Activity feed coming soon
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;

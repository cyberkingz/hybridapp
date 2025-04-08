import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, CardMedia, CardActions, Avatar, IconButton, Chip, Divider, TextField, Grid } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';

// Mock data for posts
const MOCK_POSTS = [
  {
    id: 1,
    user: {
      id: 101,
      username: 'airesearcher',
      avatar: null
    },
    content: 'This new GPT-4 update is amazing! Check out this demo of multimodal capabilities...',
    media: {
      type: 'image',
      url: 'https://placeholder.com/800x450'
    },
    tags: ['AI', 'GPT4', 'MachineLearning'],
    likes: 42,
    comments: 15,
    shares: 7,
    timestamp: '2h'
  },
  {
    id: 2,
    user: {
      id: 102,
      username: 'devguru',
      avatar: null
    },
    content: 'Just released my new project using the Stable Diffusion API. Here\'s a quick demo:',
    media: {
      type: 'video',
      url: 'https://placeholder.com/800x450',
      duration: '2:45'
    },
    tags: ['StableDiffusion', 'AIArt', 'Project'],
    likes: 128,
    comments: 32,
    shares: 24,
    timestamp: '5h'
  },
  {
    id: 3,
    user: {
      id: 103,
      username: 'codemaster',
      avatar: null
    },
    content: 'I\'ve been working on optimizing transformer models for edge devices. Here are some performance benchmarks I\'ve gathered so far.',
    media: {
      type: 'image',
      url: 'https://placeholder.com/800x450'
    },
    tags: ['EdgeAI', 'Optimization', 'Transformers'],
    likes: 89,
    comments: 21,
    shares: 15,
    timestamp: '8h'
  }
];

const NewsFeedItem = ({ post }) => {
  return (
    <Card sx={{ mb: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar src={post.user.avatar} alt={post.user.username} />
          <Box sx={{ ml: 1 }}>
            <Typography variant="subtitle1" component={Link} to={`/profile/${post.user.username}`} sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
              {post.user.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • {post.timestamp}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton aria-label="more options">
            <MoreVertIcon />
          </IconButton>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {post.content}
        </Typography>
        
        {post.media && (
          <CardMedia
            component={post.media.type === 'video' ? 'div' : 'img'}
            sx={{ 
              height: 0,
              paddingTop: '56.25%', // 16:9 aspect ratio
              position: 'relative',
              mb: 2,
              borderRadius: 1,
              bgcolor: 'grey.200'
            }}
            image={post.media.url}
            alt="Post media"
          >
            {post.media.type === 'video' && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  right: 8, 
                  bgcolor: 'rgba(0,0,0,0.6)', 
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem'
                }}
              >
                {post.media.duration}
              </Box>
            )}
          </CardMedia>
        )}
        
        <Box sx={{ mb: 2 }}>
          {post.tags.map((tag, index) => (
            <Chip 
              key={index} 
              label={`#${tag}`} 
              size="small" 
              component={Link}
              to={`/explore?tag=${tag}`}
              clickable
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Button 
          size="small" 
          startIcon={<FavoriteIcon />} 
          aria-label="like"
        >
          {post.likes}
        </Button>
        <Button 
          size="small" 
          startIcon={<CommentIcon />} 
          component={Link}
          to={`/post/${post.id}`}
          aria-label="comment"
        >
          {post.comments}
        </Button>
        <Button 
          size="small" 
          startIcon={<ShareIcon />} 
          aria-label="share"
        >
          {post.shares}
        </Button>
        <IconButton aria-label="bookmark">
          <BookmarkIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

const CreatePostCard = () => {
  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ mr: 1 }} />
          <TextField
            fullWidth
            placeholder="Create Post"
            variant="outlined"
            size="small"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 4
              }
            }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ ml: 1, minWidth: 0, width: 40, height: 40, borderRadius: '50%' }}
          >
            <AddIcon />
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const NewsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch posts
    const fetchPosts = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          setPosts(MOCK_POSTS);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleLoadMore = () => {
    // In a real app, this would load more posts
    console.log('Loading more posts...');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%' }}>
      <CreatePostCard />
      
      {loading ? (
        <Typography align="center">Loading posts...</Typography>
      ) : (
        <>
          {posts.map(post => (
            <NewsFeedItem key={post.id} post={post} />
          ))}
          
          <Box sx={{ textAlign: 'center', mt: 2, mb: 4 }}>
            <Button 
              variant="outlined" 
              onClick={handleLoadMore}
              fullWidth
            >
              Load More Posts
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default NewsFeed;

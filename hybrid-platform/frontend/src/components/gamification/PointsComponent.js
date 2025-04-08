import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  CircularProgress
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import { useAuth } from '../../context/AuthContext';

const PointsComponent = ({ userId }) => {
  const { user, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isCurrentUser = isAuthenticated && user && user._id === userId;

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      setUserData(data);
      
      // Mock points history for demo
      // In a real app, this would come from an API endpoint
      setPointsHistory([
        { id: 1, action: 'Created a post', points: 10, date: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: 2, action: 'Earned "Content Creator" badge', points: 50, date: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: 3, action: 'Started a live stream', points: 20, date: new Date(Date.now() - 86400000 * 7).toISOString() },
        { id: 4, action: 'Received 10 likes on a post', points: 15, date: new Date(Date.now() - 86400000 * 10).toISOString() },
        { id: 5, action: 'Shared code snippet', points: 5, date: new Date(Date.now() - 86400000 * 12).toISOString() }
      ]);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getNextLevelPoints = (currentPoints) => {
    // Simple level calculation: each level requires 100 * level points
    const currentLevel = Math.floor(currentPoints / 100) + 1;
    return currentLevel * 100;
  };

  const getCurrentLevel = (points) => {
    return Math.floor(points / 100) + 1;
  };

  const getProgressToNextLevel = (points) => {
    const currentLevel = getCurrentLevel(points);
    const previousLevelPoints = (currentLevel - 1) * 100;
    const nextLevelPoints = currentLevel * 100;
    const pointsInCurrentLevel = points - previousLevelPoints;
    const pointsRequiredForNextLevel = nextLevelPoints - previousLevelPoints;
    return (pointsInCurrentLevel / pointsRequiredForNextLevel) * 100;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
        <Typography>
          {error}
        </Typography>
      </Paper>
    );
  }

  if (!userData) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>
          User data not available.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Points & Level
          </Typography>
          
          <Chip 
            icon={<StarIcon />} 
            label={`Level ${getCurrentLevel(userData.points || 0)}`}
            color="primary"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" sx={{ mr: 2 }}>
            {userData.points || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            points
          </Typography>
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Level {getCurrentLevel(userData.points || 0)}</span>
            <span>Level {getCurrentLevel(userData.points || 0) + 1}</span>
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={getProgressToNextLevel(userData.points || 0)} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
          {getNextLevelPoints(userData.points || 0) - (userData.points || 0)} more points to reach Level {getCurrentLevel(userData.points || 0) + 1}
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Points History
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        {pointsHistory.length > 0 ? (
          <List>
            {pointsHistory.map((item) => (
              <ListItem key={item.id}>
                <ListItemIcon>
                  <EmojiEventsIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={item.action}
                  secondary={new Date(item.date).toLocaleDateString()}
                />
                <ListItemSecondaryAction>
                  <Chip 
                    label={`+${item.points}`}
                    color="success"
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No points history available.
          </Typography>
        )}
        
        {isCurrentUser && pointsHistory.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button 
              variant="outlined" 
              size="small"
              disabled={loadingHistory}
            >
              {loadingHistory ? <CircularProgress size={24} /> : 'Load More'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PointsComponent;

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Avatar, 
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useAuth } from '../../context/AuthContext';

const BadgesComponent = ({ userId }) => {
  const { user, isAuthenticated } = useAuth();
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkingBadges, setCheckingBadges] = useState(false);
  const [newBadges, setNewBadges] = useState([]);
  const [newBadgesDialogOpen, setNewBadgesDialogOpen] = useState(false);

  const isCurrentUser = isAuthenticated && user && user._id === userId;

  useEffect(() => {
    fetchBadges();
    fetchUserBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/badges');
      
      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }
      
      const data = await response.json();
      setBadges(data);
    } catch (err) {
      console.error('Error fetching badges:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBadges = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      
      if (userData.badges) {
        setUserBadges(userData.badges);
      }
    } catch (err) {
      console.error('Error fetching user badges:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleCheckBadges = async () => {
    if (!isAuthenticated) return;
    
    try {
      setCheckingBadges(true);
      
      const response = await fetch('/api/badges/check-all', {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check badges');
      }
      
      const data = await response.json();
      
      if (data.newlyQualifiedBadges && data.newlyQualifiedBadges.length > 0) {
        setNewBadges(data.newlyQualifiedBadges);
        setNewBadgesDialogOpen(true);
        
        // Update user badges
        setUserBadges([...userBadges, ...data.newlyQualifiedBadges]);
      } else {
        alert('No new badges earned at this time.');
      }
    } catch (err) {
      console.error('Error checking badges:', err);
      alert('Error checking badges: ' + err.message);
    } finally {
      setCheckingBadges(false);
    }
  };

  const handleNewBadgesDialogClose = () => {
    setNewBadgesDialogOpen(false);
  };

  const getBadgeIcon = (icon) => {
    // This is a simple implementation - in a real app, you might have a mapping of icon names to components
    return <EmojiEventsIcon />;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'content':
        return 'primary';
      case 'social':
        return 'secondary';
      case 'coding':
        return 'success';
      case 'streaming':
        return 'info';
      case 'general':
        return 'warning';
      default:
        return 'default';
    }
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Badges & Achievements
        </Typography>
        
        {isCurrentUser && (
          <Button 
            variant="outlined" 
            onClick={handleCheckBadges}
            disabled={checkingBadges}
          >
            {checkingBadges ? <CircularProgress size={24} /> : 'Check for New Badges'}
          </Button>
        )}
      </Box>
      
      {userBadges.length > 0 ? (
        <Grid container spacing={2}>
          {userBadges.map((badge) => (
            <Grid item xs={6} sm={4} md={3} key={badge._id}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
                onClick={() => handleBadgeClick(badge)}
              >
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {badge.icon}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  {badge.name}
                </Typography>
                <Chip 
                  label={badge.category} 
                  color={getCategoryColor(badge.category)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No badges earned yet.
          </Typography>
          {isCurrentUser && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Participate in platform activities to earn badges!
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Badge Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        {selectedBadge && (
          <>
            <DialogTitle sx={{ textAlign: 'center' }}>
              {selectedBadge.name}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ mb: 2 }}>
                  {selectedBadge.icon}
                </Typography>
                <Chip 
                  label={selectedBadge.category} 
                  color={getCategoryColor(selectedBadge.category)}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
                  {selectedBadge.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Level {selectedBadge.level} • {selectedBadge.pointsAwarded} points
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* New Badges Dialog */}
      <Dialog 
        open={newBadgesDialogOpen} 
        onClose={handleNewBadgesDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          🎉 Congratulations! 🎉
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 3 }}>
            You've earned new badges!
          </Typography>
          
          <List>
            {newBadges.map((badge) => (
              <React.Fragment key={badge._id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {badge.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={badge.name} 
                    secondary={badge.description}
                  />
                  <Chip 
                    label={`+${badge.pointsAwarded} points`}
                    color="success"
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewBadgesDialogClose} color="primary">
            Awesome!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BadgesComponent;

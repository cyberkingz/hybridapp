import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import RedditIcon from '@mui/icons-material/Reddit';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAuth } from '../../context/AuthContext';

const ShareComponent = ({ contentType, contentId, title }) => {
  const { isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sharingLinks, setSharingLinks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchSharingLinks();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDialogOpen = () => {
    handleClose();
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const fetchSharingLinks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/share/${contentType}/${contentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get sharing links');
      }
      
      const data = await response.json();
      setSharingLinks(data);
    } catch (err) {
      console.error('Error fetching sharing links:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const recordShare = async (platform) => {
    if (!isAuthenticated) return;
    
    try {
      await fetch(`/api/share/${contentType}/${contentId}/${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        }
      });
    } catch (err) {
      console.error('Error recording share:', err);
    }
  };

  const handleShare = (platform) => {
    if (!sharingLinks) return;
    
    const url = sharingLinks.platforms[platform];
    
    // Record share event
    recordShare(platform);
    
    // Open sharing URL in new window
    window.open(url, '_blank');
    
    handleClose();
  };

  const copyToClipboard = () => {
    if (!sharingLinks) return;
    
    navigator.clipboard.writeText(sharingLinks.url)
      .then(() => {
        setSnackbarMessage('Link copied to clipboard!');
        setSnackbarOpen(true);
        
        // Record share event
        recordShare('copy');
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        setSnackbarMessage('Failed to copy link');
        setSnackbarOpen(true);
      });
      
    handleDialogClose();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <IconButton onClick={handleClick} aria-label="share">
        <ShareIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleShare('twitter')}>
          <TwitterIcon sx={{ mr: 1 }} /> Twitter
        </MenuItem>
        <MenuItem onClick={() => handleShare('facebook')}>
          <FacebookIcon sx={{ mr: 1 }} /> Facebook
        </MenuItem>
        <MenuItem onClick={() => handleShare('linkedin')}>
          <LinkedInIcon sx={{ mr: 1 }} /> LinkedIn
        </MenuItem>
        <MenuItem onClick={() => handleShare('reddit')}>
          <RedditIcon sx={{ mr: 1 }} /> Reddit
        </MenuItem>
        <MenuItem onClick={() => handleShare('email')}>
          <EmailIcon sx={{ mr: 1 }} /> Email
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDialogOpen}>
          <ContentCopyIcon sx={{ mr: 1 }} /> Copy Link
        </MenuItem>
      </Menu>
      
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Share</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {title || 'Share this content'}
          </Typography>
          
          {sharingLinks && (
            <TextField
              fullWidth
              variant="outlined"
              value={sharingLinks.url}
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
            />
          )}
          
          <List>
            <ListItem button onClick={() => handleShare('twitter')}>
              <ListItemIcon>
                <TwitterIcon />
              </ListItemIcon>
              <ListItemText primary="Twitter" />
            </ListItem>
            <ListItem button onClick={() => handleShare('facebook')}>
              <ListItemIcon>
                <FacebookIcon />
              </ListItemIcon>
              <ListItemText primary="Facebook" />
            </ListItem>
            <ListItem button onClick={() => handleShare('linkedin')}>
              <ListItemIcon>
                <LinkedInIcon />
              </ListItemIcon>
              <ListItemText primary="LinkedIn" />
            </ListItem>
            <ListItem button onClick={() => handleShare('reddit')}>
              <ListItemIcon>
                <RedditIcon />
              </ListItemIcon>
              <ListItemText primary="Reddit" />
            </ListItem>
            <ListItem button onClick={() => handleShare('email')}>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText primary="Email" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={copyToClipboard} color="primary">
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareComponent;

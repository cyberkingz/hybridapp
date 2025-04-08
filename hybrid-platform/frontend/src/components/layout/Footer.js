import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              About
            </Typography>
            <Typography variant="body2" color="text.secondary">
              VIBE.AI is a hybrid platform for AI enthusiasts and indie hackers to share news, 
              live code, and collaborate on projects.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Resources
            </Typography>
            <Link href="#" color="inherit" display="block">Help Center</Link>
            <Link href="#" color="inherit" display="block">Documentation</Link>
            <Link href="#" color="inherit" display="block">API</Link>
            <Link href="#" color="inherit" display="block">Community Guidelines</Link>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Legal
            </Typography>
            <Link href="#" color="inherit" display="block">Terms of Service</Link>
            <Link href="#" color="inherit" display="block">Privacy Policy</Link>
            <Link href="#" color="inherit" display="block">Cookie Policy</Link>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Connect
            </Typography>
            <Link href="#" color="inherit" display="block">Twitter</Link>
            <Link href="#" color="inherit" display="block">GitHub</Link>
            <Link href="#" color="inherit" display="block">Discord</Link>
            <Link href="#" color="inherit" display="block">Contact Us</Link>
          </Grid>
        </Grid>
        
        <Box mt={5}>
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            <Link color="inherit" href="/">
              VIBE.AI
            </Link>{' '}
            {new Date().getFullYear()}
            {'. All rights reserved.'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

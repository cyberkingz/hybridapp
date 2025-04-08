import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Grid, 
  Avatar, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import VideocamIcon from '@mui/icons-material/Videocam';
import CodeIcon from '@mui/icons-material/Code';
import { Link as RouterLink } from 'react-router-dom';

const LeaderboardPage = () => {
  const theme = useTheme();
  const [leaderboardType, setLeaderboardType] = useState('points');
  const [timeframe, setTimeframe] = useState('weekly');
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType, timeframe]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboards/${leaderboardType}/${timeframe}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (event, newValue) => {
    setLeaderboardType(newValue);
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'points':
        return <EmojiEventsIcon />;
      case 'content':
        return <GroupIcon />;
      case 'streams':
        return <VideocamIcon />;
      case 'coding':
        return <CodeIcon />;
      default:
        return <EmojiEventsIcon />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'points':
        return 'Points';
      case 'content':
        return 'Content Creation';
      case 'streams':
        return 'Streaming';
      case 'coding':
        return 'Coding';
      default:
        return 'Points';
    }
  };

  const getTimeframeLabel = (tf) => {
    switch (tf) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      case 'alltime':
        return 'All Time';
      default:
        return 'This Week';
    }
  };

  const getScoreLabel = (type) => {
    switch (type) {
      case 'points':
        return 'Points';
      case 'content':
        return 'Posts & Videos';
      case 'streams':
        return 'Streams';
      case 'coding':
        return 'Code Sessions';
      default:
        return 'Score';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Leaderboards
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={leaderboardType}
          onChange={handleTypeChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="leaderboard type tabs"
        >
          <Tab 
            icon={<EmojiEventsIcon />} 
            label="Points" 
            value="points" 
          />
          <Tab 
            icon={<GroupIcon />} 
            label="Content" 
            value="content" 
          />
          <Tab 
            icon={<VideocamIcon />} 
            label="Streams" 
            value="streams" 
          />
          <Tab 
            icon={<CodeIcon />} 
            label="Coding" 
            value="coding" 
          />
        </Tabs>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          {getTypeIcon(leaderboardType)}
          <span style={{ marginLeft: theme.spacing(1) }}>
            {getTypeLabel(leaderboardType)} Leaderboard
          </span>
        </Typography>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
          <Select
            labelId="timeframe-select-label"
            id="timeframe-select"
            value={timeframe}
            label="Timeframe"
            onChange={handleTimeframeChange}
          >
            <MenuItem value="daily">Today</MenuItem>
            <MenuItem value="weekly">This Week</MenuItem>
            <MenuItem value="monthly">This Month</MenuItem>
            <MenuItem value="alltime">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
          <Typography>
            {error}
          </Typography>
        </Paper>
      ) : leaderboard && leaderboard.entries.length > 0 ? (
        <>
          {/* Top 3 Users */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Second Place */}
            {leaderboard.entries.length > 1 && (
              <Grid item xs={12} sm={4}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    2nd Place
                  </Typography>
                  <Avatar 
                    src={leaderboard.entries[1].user.avatar} 
                    alt={leaderboard.entries[1].user.username}
                    sx={{ width: 80, height: 80, mb: 2 }}
                  />
                  <Typography variant="h6" component={RouterLink} to={`/profile/${leaderboard.entries[1].user._id}`} sx={{ 
                    textDecoration: 'none',
                    color: 'text.primary'
                  }}>
                    {leaderboard.entries[1].user.username}
                  </Typography>
                  <Chip 
                    label={`${leaderboard.entries[1].score} ${getScoreLabel(leaderboardType)}`}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
            )}
            
            {/* First Place */}
            <Grid item xs={12} sm={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'warning.light',
                  position: 'relative',
                  top: { xs: 0, sm: -20 },
                  height: { xs: 'auto', sm: 'calc(100% + 40px)' }
                }}
              >
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  🏆 1st Place 🏆
                </Typography>
                <Avatar 
                  src={leaderboard.entries[0].user.avatar} 
                  alt={leaderboard.entries[0].user.username}
                  sx={{ width: 100, height: 100, mb: 2 }}
                />
                <Typography variant="h5" component={RouterLink} to={`/profile/${leaderboard.entries[0].user._id}`} sx={{ 
                  textDecoration: 'none',
                  color: 'text.primary'
                }}>
                  {leaderboard.entries[0].user.username}
                </Typography>
                <Chip 
                  label={`${leaderboard.entries[0].score} ${getScoreLabel(leaderboardType)}`}
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
            
            {/* Third Place */}
            {leaderboard.entries.length > 2 && (
              <Grid item xs={12} sm={4}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    3rd Place
                  </Typography>
                  <Avatar 
                    src={leaderboard.entries[2].user.avatar} 
                    alt={leaderboard.entries[2].user.username}
                    sx={{ width: 80, height: 80, mb: 2 }}
                  />
                  <Typography variant="h6" component={RouterLink} to={`/profile/${leaderboard.entries[2].user._id}`} sx={{ 
                    textDecoration: 'none',
                    color: 'text.primary'
                  }}>
                    {leaderboard.entries[2].user.username}
                  </Typography>
                  <Chip 
                    label={`${leaderboard.entries[2].score} ${getScoreLabel(leaderboardType)}`}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
            )}
          </Grid>
          
          {/* Leaderboard Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell align="right">{getScoreLabel(leaderboardType)}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.entries.slice(0, 20).map((entry) => (
                  <TableRow 
                    key={entry.user._id}
                    sx={{ 
                      '&:nth-of-type(1)': { bgcolor: 'warning.light' },
                      '&:nth-of-type(2)': { bgcolor: 'grey.100' },
                      '&:nth-of-type(3)': { bgcolor: 'grey.100' }
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {entry.rank}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={entry.user.avatar} 
                          alt={entry.user.username}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        />
                        <Typography 
                          component={RouterLink} 
                          to={`/profile/${entry.user._id}`}
                          sx={{ 
                            textDecoration: 'none',
                            color: 'text.primary',
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          {entry.user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={entry.score}
                        color={entry.rank <= 3 ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'right' }}>
            Last updated: {new Date(leaderboard.lastUpdated).toLocaleString()}
          </Typography>
        </>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>
            No data available for this leaderboard.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default LeaderboardPage;

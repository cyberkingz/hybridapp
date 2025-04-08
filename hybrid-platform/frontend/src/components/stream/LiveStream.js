import React, { useState, useEffect, useRef } from 'react';
import { Box, Grid, Typography, Paper, TextField, Button, Avatar, IconButton, Chip, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PollIcon from '@mui/icons-material/Poll';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CodeIcon from '@mui/icons-material/Code';
import MonacoEditor from 'react-monaco-editor';

// Mock data for live stream
const MOCK_STREAM = {
  id: 'stream123',
  title: 'Building a GPT-3 Powered Chatbot',
  language: 'Python',
  startedAt: '45 minutes ago',
  viewers: 78,
  host: {
    username: 'aidev',
    avatar: null
  }
};

// Mock chat messages
const MOCK_CHAT_MESSAGES = [
  { id: 1, username: 'User1', message: 'Great project!', timestamp: '2 min ago' },
  { id: 2, username: 'User2', message: 'How are you handling the token limit?', timestamp: '1 min ago' },
  { id: 3, username: 'User3', message: 'Will you add a web interface to this?', timestamp: 'just now' }
];

// Mock code suggestions
const MOCK_SUGGESTIONS = [
  { 
    id: 1, 
    username: 'User3', 
    suggestion: 'You should add error handling for API rate limits', 
    upvotes: 12, 
    downvotes: 2 
  },
  { 
    id: 2, 
    username: 'User4', 
    suggestion: 'Consider using async functions for better performance', 
    upvotes: 8, 
    downvotes: 1 
  }
];

// Initial code sample
const INITIAL_CODE = `import openai
import os

# Set up OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_response(prompt):
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        max_tokens=150,
        temperature=0.7
    )
    return response.choices[0].text.strip()

# Example usage
user_input = "What is machine learning?"
ai_response = generate_response(user_input)
print(ai_response)
`;

const LiveStreamComponent = () => {
  const [chatMessages, setChatMessages] = useState(MOCK_CHAT_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [code, setCode] = useState(INITIAL_CODE);
  const [isStreaming, setIsStreaming] = useState(true);
  
  const chatContainerRef = useRef(null);
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const newChatMessage = {
      id: chatMessages.length + 1,
      username: 'You',
      message: newMessage,
      timestamp: 'just now'
    };
    
    setChatMessages([...chatMessages, newChatMessage]);
    setNewMessage('');
  };
  
  const handleSendSuggestion = () => {
    if (newSuggestion.trim() === '') return;
    
    const newSuggestionItem = {
      id: suggestions.length + 1,
      username: 'You',
      suggestion: newSuggestion,
      upvotes: 0,
      downvotes: 0
    };
    
    setSuggestions([...suggestions, newSuggestionItem]);
    setNewSuggestion('');
  };
  
  const handleCodeChange = (newValue) => {
    setCode(newValue);
  };
  
  const handleVote = (id, type) => {
    setSuggestions(suggestions.map(suggestion => {
      if (suggestion.id === id) {
        if (type === 'up') {
          return { ...suggestion, upvotes: suggestion.upvotes + 1 };
        } else {
          return { ...suggestion, downvotes: suggestion.downvotes + 1 };
        }
      }
      return suggestion;
    }));
  };
  
  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: { enabled: false }
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', py: 2 }}>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          {MOCK_STREAM.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip 
            label={MOCK_STREAM.language} 
            color="primary" 
            size="small" 
            sx={{ mr: 1 }} 
          />
          <Typography variant="body2" color="text.secondary">
            Started {MOCK_STREAM.startedAt} • {MOCK_STREAM.viewers} viewers
          </Typography>
        </Box>
      </Paper>
      
      <Grid container spacing={2}>
        {/* Left column: Video stream */}
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              height: 360, 
              bgcolor: 'black', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: 2,
              mb: 2
            }}
          >
            {isStreaming ? (
              <Typography variant="h6">
                🔴 LIVE STREAM
              </Typography>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Stream Ended
                </Typography>
                <Button variant="contained" color="error">
                  Watch Replay
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Right column: Code editor */}
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              height: 360, 
              overflow: 'hidden',
              borderRadius: 2,
              mb: 2
            }}
          >
            <Box sx={{ height: '100%', width: '100%' }}>
              {/* In a real app, we would use the actual Monaco editor component */}
              <Box
                sx={{
                  height: '100%',
                  width: '100%',
                  bgcolor: '#1e1e1e',
                  color: '#d4d4d4',
                  fontFamily: 'monospace',
                  p: 2,
                  overflow: 'auto',
                  whiteSpace: 'pre',
                  fontSize: '14px',
                  lineHeight: 1.5
                }}
              >
                {code}
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Chat section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: 400, borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
              <Typography variant="h6">Chat</Typography>
            </Box>
            
            <Box 
              ref={chatContainerRef}
              sx={{ 
                height: 'calc(100% - 110px)', 
                overflowY: 'auto',
                p: 2
              }}
            >
              {chatMessages.map((msg) => (
                <Box key={msg.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Avatar 
                      sx={{ width: 32, height: 32, mr: 1, fontSize: '0.875rem' }}
                    >
                      {msg.username.charAt(0)}
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ mr: 1 }}>
                          {msg.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {msg.timestamp}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {msg.message}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
            
            <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
              <Box sx={{ display: 'flex' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  sx={{ mr: 1 }}
                />
                <Button 
                  variant="contained" 
                  color="primary"
                  endIcon={<SendIcon />}
                  onClick={handleSendMessage}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Suggestions section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: 400, borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
              <Typography variant="h6">Suggestions</Typography>
            </Box>
            
            <Box 
              sx={{ 
                height: 'calc(100% - 110px)', 
                overflowY: 'auto',
                p: 2
              }}
            >
              {suggestions.map((suggestion) => (
                <Box key={suggestion.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Avatar 
                      sx={{ width: 32, height: 32, mr: 1, fontSize: '0.875rem' }}
                    >
                      {suggestion.username.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">
                        {suggestion.username}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {suggestion.suggestion}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleVote(suggestion.id, 'up')}
                        >
                          <ThumbUpIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ mx: 0.5 }}>
                          {suggestion.upvotes}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => handleVote(suggestion.id, 'down')}
                        >
                          <ThumbDownIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ mx: 0.5 }}>
                          {suggestion.downvotes}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
            
            <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
              <Box sx={{ display: 'flex' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Make a suggestion..."
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendSuggestion();
                    }
                  }}
                  sx={{ mr: 1 }}
                />
                <Button 
                  variant="contained" 
                  color="secondary"
                  endIcon={<SendIcon />}
                  onClick={handleSendSuggestion}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<ThumbUpIcon />}
        >
          Vote
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<CodeIcon />}
        >
          Suggest
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<PollIcon />}
        >
          Poll
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<GroupAddIcon />}
        >
          Request to Join
        </Button>
      </Box>
    </Box>
  );
};

export default LiveStreamComponent;

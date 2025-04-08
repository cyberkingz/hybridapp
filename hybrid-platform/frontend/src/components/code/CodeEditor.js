import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Avatar, Paper, Grid, Tabs, Tab, Chip } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import MonacoEditor from 'react-monaco-editor';

// Mock data for code editor
const MOCK_CODE_SESSION = {
  id: 'session123',
  title: 'Building a GPT-3 Powered Chatbot',
  language: 'python',
  createdAt: '45 minutes ago',
  owner: {
    username: 'aidev',
    avatar: null
  },
  code: `import openai
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
`
};

const CodeEditorComponent = () => {
  const [code, setCode] = useState(MOCK_CODE_SESSION.code);
  const [language, setLanguage] = useState(MOCK_CODE_SESSION.language);
  const [currentTab, setCurrentTab] = useState(0);
  const [isEditing, setIsEditing] = useState(true);
  
  const handleCodeChange = (newValue) => {
    setCode(newValue);
  };
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
  };
  
  const handleSaveCode = () => {
    console.log('Saving code:', code);
    // In a real app, this would save to the backend
  };
  
  const handleRunCode = () => {
    console.log('Running code...');
    // In a real app, this would execute the code and show results
  };
  
  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: !isEditing,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: { enabled: true }
  };
  
  const supportedLanguages = [
    { name: 'Python', value: 'python' },
    { name: 'JavaScript', value: 'javascript' },
    { name: 'TypeScript', value: 'typescript' },
    { name: 'HTML', value: 'html' },
    { name: 'CSS', value: 'css' },
    { name: 'Java', value: 'java' },
    { name: 'C++', value: 'cpp' },
    { name: 'Go', value: 'go' }
  ];
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', py: 2 }}>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              {MOCK_CODE_SESSION.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                {MOCK_CODE_SESSION.owner.username.charAt(0)}
              </Avatar>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                {MOCK_CODE_SESSION.owner.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created {MOCK_CODE_SESSION.createdAt}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSaveCode}
              sx={{ mr: 1 }}
            >
              Save
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleRunCode}
            >
              Run
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Language:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {supportedLanguages.map((lang) => (
              <Chip
                key={lang.value}
                label={lang.name}
                onClick={() => handleLanguageChange(lang.value)}
                color={language === lang.value ? 'primary' : 'default'}
                variant={language === lang.value ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>
      </Paper>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Code Editor" />
              <Tab label="Output" />
              <Tab label="Documentation" />
            </Tabs>
            
            <Box sx={{ height: 500 }}>
              {currentTab === 0 && (
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
              )}
              
              {currentTab === 1 && (
                <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    Execution Output
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      height: 'calc(100% - 40px)',
                      overflow: 'auto'
                    }}
                  >
                    <Typography variant="body2">
                      {/* Sample output */}
                      Machine learning is a branch of artificial intelligence (AI) and computer science which focuses on the use of data and algorithms to imitate the way that humans learn, gradually improving its accuracy.
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              {currentTab === 2 && (
                <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    Documentation
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    OpenAI API Usage
                  </Typography>
                  <Typography variant="body2" paragraph>
                    This code demonstrates how to use the OpenAI API to create a simple chatbot. The API key is stored as an environment variable for security.
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Functions
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>generate_response(prompt)</strong>: Takes a user prompt and returns the AI-generated response using OpenAI's text-davinci-003 model.
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Parameters
                  </Typography>
                  <Typography variant="body2">
                    <ul>
                      <li><strong>engine</strong>: The OpenAI model to use</li>
                      <li><strong>max_tokens</strong>: Maximum length of the generated response</li>
                      <li><strong>temperature</strong>: Controls randomness (0-1)</li>
                    </ul>
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Collaboration Settings
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Access Control
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Who can view this code:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label="Public" color="primary" />
                  <Chip label="Private" variant="outlined" />
                  <Chip label="Specific Users" variant="outlined" />
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Who can edit this code:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label="Only Me" color="primary" />
                  <Chip label="Anyone" variant="outlined" />
                  <Chip label="Specific Users" variant="outlined" />
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Version Control
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Current Version: v1.0
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                startIcon={<CodeIcon />}
                fullWidth
              >
                View Version History
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CodeEditorComponent;

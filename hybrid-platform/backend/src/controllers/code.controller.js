const CodeSession = require('../models/codeSession.model');
const User = require('../models/user.model');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all code sessions
// @route   GET /api/code/sessions
// @access  Public
exports.getAllSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const sessions = await CodeSession.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name username avatar')
      .populate('participants', 'name username avatar');
    
    const total = await CodeSession.countDocuments();
    
    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error in getAllSessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get code session by ID
// @route   GET /api/code/sessions/:id
// @access  Public
exports.getSessionById = async (req, res) => {
  try {
    const session = await CodeSession.findById(req.params.id)
      .populate('creator', 'name username avatar')
      .populate('participants', 'name username avatar');
    
    if (!session) {
      return res.status(404).json({ message: 'Code session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error in getSessionById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new code session
// @route   POST /api/code/sessions
// @access  Private
exports.createSession = async (req, res) => {
  try {
    const { title, description, language, code, isPublic } = req.body;
    
    const newSession = new CodeSession({
      title,
      description,
      language,
      code: code || '',
      isPublic: isPublic !== undefined ? isPublic : true,
      creator: req.user.id,
      participants: [req.user.id]
    });
    
    const session = await newSession.save();
    
    // Add session to user's sessions
    await User.findByIdAndUpdate(req.user.id, {
      $push: { codeSessions: session._id }
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error in createSession:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update code session
// @route   PUT /api/code/sessions/:id
// @access  Private
exports.updateSession = async (req, res) => {
  try {
    const { title, description, language, code, isPublic } = req.body;
    
    let session = await CodeSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Code session not found' });
    }
    
    // Check if user is the creator or a participant
    if (session.creator.toString() !== req.user.id && 
        !session.participants.includes(req.user.id)) {
      return res.status(401).json({ message: 'Not authorized to update this session' });
    }
    
    const updatedSession = {
      title: title || session.title,
      description: description || session.description,
      language: language || session.language,
      code: code !== undefined ? code : session.code,
      isPublic: isPublic !== undefined ? isPublic : session.isPublic
    };
    
    session = await CodeSession.findByIdAndUpdate(
      req.params.id,
      { $set: updatedSession },
      { new: true }
    );
    
    res.json(session);
  } catch (error) {
    console.error('Error in updateSession:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete code session
// @route   DELETE /api/code/sessions/:id
// @access  Private
exports.deleteSession = async (req, res) => {
  try {
    const session = await CodeSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Code session not found' });
    }
    
    // Check if user is the creator
    if (session.creator.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this session' });
    }
    
    await session.remove();
    
    // Remove session from user's sessions
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { codeSessions: req.params.id }
    });
    
    // Remove session from participants' sessions
    for (const participantId of session.participants) {
      if (participantId.toString() !== req.user.id) {
        await User.findByIdAndUpdate(participantId, {
          $pull: { codeSessions: req.params.id }
        });
      }
    }
    
    res.json({ message: 'Code session removed' });
  } catch (error) {
    console.error('Error in deleteSession:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join a code session
// @route   POST /api/code/sessions/:id/join
// @access  Private
exports.joinSession = async (req, res) => {
  try {
    const session = await CodeSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Code session not found' });
    }
    
    // Check if session is public or user is invited
    if (!session.isPublic && !session.invitedUsers.includes(req.user.id)) {
      return res.status(401).json({ message: 'Not authorized to join this private session' });
    }
    
    // Check if user is already a participant
    if (session.participants.some(p => p.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Already a participant in this session' });
    }
    
    // Add user to participants
    session.participants.push(req.user.id);
    await session.save();
    
    // Add session to user's sessions
    await User.findByIdAndUpdate(req.user.id, {
      $push: { codeSessions: session._id }
    });
    
    res.json(session);
  } catch (error) {
    console.error('Error in joinSession:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Leave a code session
// @route   POST /api/code/sessions/:id/leave
// @access  Private
exports.leaveSession = async (req, res) => {
  try {
    const session = await CodeSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Code session not found' });
    }
    
    // Check if user is a participant
    if (!session.participants.some(p => p.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Not a participant in this session' });
    }
    
    // Creator cannot leave, they must delete the session
    if (session.creator.toString() === req.user.id) {
      return res.status(400).json({ message: 'Creator cannot leave the session, please delete it instead' });
    }
    
    // Remove user from participants
    session.participants = session.participants.filter(
      p => p.toString() !== req.user.id
    );
    await session.save();
    
    // Remove session from user's sessions
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { codeSessions: session._id }
    });
    
    res.json({ message: 'Left the code session successfully' });
  } catch (error) {
    console.error('Error in leaveSession:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save code from a session
// @route   POST /api/code/sessions/:id/save
// @access  Private
exports.saveCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    const session = await CodeSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Code session not found' });
    }
    
    // Check if user is a participant
    if (!session.participants.some(p => p.toString() === req.user.id)) {
      return res.status(401).json({ message: 'Not authorized to save code for this session' });
    }
    
    // Update session code
    session.code = code;
    session.lastUpdated = Date.now();
    session.lastUpdatedBy = req.user.id;
    
    await session.save();
    
    res.json(session);
  } catch (error) {
    console.error('Error in saveCode:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Execute code
// @route   POST /api/code/execute
// @access  Private
exports.executeCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // Create a temporary directory for code execution
    const tempDir = path.join(__dirname, '../temp', uuidv4());
    fs.mkdirSync(tempDir, { recursive: true });
    
    let fileName, command;
    
    // Set up file and command based on language
    switch (language.toLowerCase()) {
      case 'javascript':
        fileName = 'code.js';
        command = `node ${fileName}`;
        break;
      case 'python':
        fileName = 'code.py';
        command = `python ${fileName}`;
        break;
      case 'java':
        fileName = 'Main.java';
        command = `javac ${fileName} && java Main`;
        break;
      default:
        return res.status(400).json({ message: 'Unsupported language' });
    }
    
    // Write code to file
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, code);
    
    // Execute code with timeout
    exec(command, { cwd: tempDir, timeout: 5000 }, (error, stdout, stderr) => {
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      if (error) {
        return res.json({
          success: false,
          output: stderr || error.message
        });
      }
      
      res.json({
        success: true,
        output: stdout
      });
    });
  } catch (error) {
    console.error('Error in executeCode:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get code templates
// @route   GET /api/code/templates
// @access  Public
exports.getTemplates = async (req, res) => {
  try {
    const templates = {
      javascript: [
        {
          name: 'Hello World',
          code: 'console.log("Hello, World!");'
        },
        {
          name: 'Express Server',
          code: `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`
        }
      ],
      python: [
        {
          name: 'Hello World',
          code: 'print("Hello, World!")'
        },
        {
          name: 'Flask Server',
          code: `from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)`
        }
      ],
      java: [
        {
          name: 'Hello World',
          code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
        },
        {
          name: 'Spring Boot',
          code: `import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}

@RestController
class HelloController {
    @GetMapping("/")
    public String hello() {
        return "Hello, World!";
    }
}`
        }
      ]
    };
    
    res.json(templates);
  } catch (error) {
    console.error('Error in getTemplates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const io = require('socket.io');
const Stream = require('../models/stream.model');
const User = require('../models/user.model');
const CodeSession = require('../models/codeSession.model');
const jwt = require('jsonwebtoken');

// Socket.io service for handling real-time communications
module.exports = function(socketServer) {
  // Authentication middleware for socket connections
  socketServer.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      
      // Find user
      const user = await User.findById(decoded.user.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connection
  socketServer.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Join user's personal room for direct messages
    socket.join(`user:${socket.user.id}`);
    
    // Handle joining a stream room
    socket.on('stream:join', async (streamId) => {
      try {
        // Find stream
        const stream = await Stream.findById(streamId);
        
        if (!stream) {
          socket.emit('error', { message: 'Stream not found' });
          return;
        }
        
        // Join stream room
        socket.join(`stream:${streamId}`);
        
        // Add user to viewers if not already there
        await stream.addViewer(socket.user.id);
        
        // Notify room that user joined
        socket.to(`stream:${streamId}`).emit('stream:viewer_join', {
          userId: socket.user.id,
          username: socket.user.username
        });
        
        // Send current viewer count to all users in the room
        socketServer.to(`stream:${streamId}`).emit('stream:viewer_count', {
          count: stream.viewers.length
        });
        
        console.log(`User ${socket.user.username} joined stream ${streamId}`);
      } catch (err) {
        console.error('Error joining stream:', err);
        socket.emit('error', { message: 'Error joining stream' });
      }
    });
    
    // Handle leaving a stream room
    socket.on('stream:leave', async (streamId) => {
      try {
        // Find stream
        const stream = await Stream.findById(streamId);
        
        if (stream) {
          // Remove user from viewers
          await stream.removeViewer(socket.user.id);
          
          // Notify room that user left
          socket.to(`stream:${streamId}`).emit('stream:viewer_leave', {
            userId: socket.user.id,
            username: socket.user.username
          });
          
          // Send current viewer count to all users in the room
          socketServer.to(`stream:${streamId}`).emit('stream:viewer_count', {
            count: stream.viewers.length
          });
        }
        
        // Leave stream room
        socket.leave(`stream:${streamId}`);
        
        console.log(`User ${socket.user.username} left stream ${streamId}`);
      } catch (err) {
        console.error('Error leaving stream:', err);
      }
    });
    
    // Handle chat messages in a stream
    socket.on('chat:message', async (data) => {
      try {
        const { streamId, message } = data;
        
        // Validate message
        if (!message || !message.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }
        
        // Create chat message object
        const chatMessage = {
          userId: socket.user.id,
          username: socket.user.username,
          message: message.trim(),
          timestamp: new Date()
        };
        
        // Broadcast message to stream room
        socketServer.to(`stream:${streamId}`).emit('chat:message', chatMessage);
        
        console.log(`Chat message in stream ${streamId} from ${socket.user.username}: ${message}`);
      } catch (err) {
        console.error('Error sending chat message:', err);
        socket.emit('error', { message: 'Error sending message' });
      }
    });
    
    // Handle code editor changes
    socket.on('code:change', async (data) => {
      try {
        const { sessionId, code, position } = data;
        
        // Find code session
        const codeSession = await CodeSession.findById(sessionId);
        
        if (!codeSession) {
          socket.emit('error', { message: 'Code session not found' });
          return;
        }
        
        // Check if user is owner or collaborator
        const isAuthorized = 
          codeSession.owner.toString() === socket.user.id ||
          codeSession.collaborators.some(id => id.toString() === socket.user.id);
        
        if (!isAuthorized) {
          socket.emit('error', { message: 'Not authorized to edit this code session' });
          return;
        }
        
        // Broadcast code change to all users in the session
        socket.to(`code:${sessionId}`).emit('code:change', {
          userId: socket.user.id,
          username: socket.user.username,
          code,
          position
        });
        
        // Update code content in database (debounced on client side)
        if (data.save) {
          codeSession.updateCode(code, socket.user.id);
        }
      } catch (err) {
        console.error('Error handling code change:', err);
        socket.emit('error', { message: 'Error updating code' });
      }
    });
    
    // Handle code suggestions
    socket.on('code:suggestion', async (data) => {
      try {
        const { sessionId, suggestion, lineStart, lineEnd } = data;
        
        // Validate suggestion
        if (!suggestion || !suggestion.trim()) {
          socket.emit('error', { message: 'Suggestion cannot be empty' });
          return;
        }
        
        // Create suggestion object
        const codeSuggestion = {
          userId: socket.user.id,
          username: socket.user.username,
          suggestion: suggestion.trim(),
          lineStart,
          lineEnd,
          timestamp: new Date()
        };
        
        // Broadcast suggestion to all users in the session
        socketServer.to(`code:${sessionId}`).emit('code:suggestion', codeSuggestion);
        
        console.log(`Code suggestion in session ${sessionId} from ${socket.user.username}`);
      } catch (err) {
        console.error('Error sending code suggestion:', err);
        socket.emit('error', { message: 'Error sending suggestion' });
      }
    });
    
    // Handle voting on code suggestions
    socket.on('code:vote', async (data) => {
      try {
        const { sessionId, suggestionId, voteType } = data;
        
        // Validate vote type
        if (voteType !== 'up' && voteType !== 'down') {
          socket.emit('error', { message: 'Invalid vote type' });
          return;
        }
        
        // Create vote object
        const vote = {
          suggestionId,
          userId: socket.user.id,
          username: socket.user.username,
          voteType,
          timestamp: new Date()
        };
        
        // Broadcast vote to all users in the session
        socketServer.to(`code:${sessionId}`).emit('code:vote', vote);
        
        console.log(`Vote on suggestion ${suggestionId} in session ${sessionId} from ${socket.user.username}: ${voteType}`);
      } catch (err) {
        console.error('Error handling vote:', err);
        socket.emit('error', { message: 'Error processing vote' });
      }
    });
    
    // Handle stream polls
    socket.on('stream:poll_create', async (data) => {
      try {
        const { streamId, question, options, duration } = data;
        
        // Validate poll data
        if (!question || !options || !options.length) {
          socket.emit('error', { message: 'Invalid poll data' });
          return;
        }
        
        // Find stream
        const stream = await Stream.findById(streamId);
        
        if (!stream) {
          socket.emit('error', { message: 'Stream not found' });
          return;
        }
        
        // Check if user is stream owner
        if (stream.user.toString() !== socket.user.id) {
          socket.emit('error', { message: 'Only stream owner can create polls' });
          return;
        }
        
        // Create poll object
        const poll = {
          id: Date.now().toString(),
          question,
          options: options.map(option => ({
            id: Date.now() + Math.floor(Math.random() * 1000),
            text: option,
            votes: 0
          })),
          createdBy: socket.user.id,
          createdAt: new Date(),
          endsAt: duration ? new Date(Date.now() + duration * 1000) : null
        };
        
        // Broadcast poll to all users in the stream
        socketServer.to(`stream:${streamId}`).emit('stream:poll_created', poll);
        
        console.log(`Poll created in stream ${streamId} by ${socket.user.username}`);
        
        // Set timeout to end poll if duration is provided
        if (duration) {
          setTimeout(() => {
            socketServer.to(`stream:${streamId}`).emit('stream:poll_ended', {
              pollId: poll.id
            });
            
            console.log(`Poll ${poll.id} ended in stream ${streamId}`);
          }, duration * 1000);
        }
      } catch (err) {
        console.error('Error creating poll:', err);
        socket.emit('error', { message: 'Error creating poll' });
      }
    });
    
    // Handle poll votes
    socket.on('stream:poll_vote', async (data) => {
      try {
        const { streamId, pollId, optionId } = data;
        
        // Create vote object
        const vote = {
          pollId,
          optionId,
          userId: socket.user.id,
          username: socket.user.username,
          timestamp: new Date()
        };
        
        // Broadcast vote to all users in the stream
        socketServer.to(`stream:${streamId}`).emit('stream:poll_vote', vote);
        
        console.log(`Vote on poll ${pollId} in stream ${streamId} from ${socket.user.username}`);
      } catch (err) {
        console.error('Error handling poll vote:', err);
        socket.emit('error', { message: 'Error processing poll vote' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      
      // Handle any cleanup needed
      // This could include removing user from active streams, etc.
    });
  });

  return socketServer;
};

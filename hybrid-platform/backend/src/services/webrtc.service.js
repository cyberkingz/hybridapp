// WebRTC service for handling peer-to-peer streaming
const Stream = require('../models/stream.model');
const User = require('../models/user.model');

class WebRTCService {
  constructor(io) {
    this.io = io;
    this.peers = new Map(); // Map of user IDs to their peer connections
    this.streams = new Map(); // Map of stream IDs to active broadcaster info
    
    // Initialize socket event handlers
    this.initSocketHandlers();
  }
  
  initSocketHandlers() {
    this.io.on('connection', (socket) => {
      // Handle stream broadcasting
      socket.on('webrtc:start_broadcast', async (data) => {
        try {
          const { streamId } = data;
          
          // Find stream
          const stream = await Stream.findById(streamId);
          
          if (!stream) {
            socket.emit('error', { message: 'Stream not found' });
            return;
          }
          
          // Check if user is stream owner
          if (stream.user.toString() !== socket.user.id) {
            socket.emit('error', { message: 'Only stream owner can broadcast' });
            return;
          }
          
          // Register as broadcaster for this stream
          this.streams.set(streamId, {
            broadcasterId: socket.user.id,
            socketId: socket.id
          });
          
          // Join broadcaster to stream room
          socket.join(`stream:${streamId}:broadcast`);
          
          console.log(`User ${socket.user.username} started broadcasting stream ${streamId}`);
          
          // Notify all viewers that broadcast has started
          this.io.to(`stream:${streamId}`).emit('webrtc:broadcast_started', {
            streamId,
            broadcasterId: socket.user.id
          });
        } catch (err) {
          console.error('Error starting broadcast:', err);
          socket.emit('error', { message: 'Error starting broadcast' });
        }
      });
      
      // Handle viewer joining stream
      socket.on('webrtc:join_stream', async (data) => {
        try {
          const { streamId } = data;
          
          // Find stream
          const stream = await Stream.findById(streamId);
          
          if (!stream) {
            socket.emit('error', { message: 'Stream not found' });
            return;
          }
          
          // Check if stream is live
          if (stream.status !== 'live') {
            socket.emit('error', { message: 'Stream is not live' });
            return;
          }
          
          // Check if there's an active broadcaster
          const broadcasterInfo = this.streams.get(streamId);
          
          if (!broadcasterInfo) {
            socket.emit('error', { message: 'No active broadcaster for this stream' });
            return;
          }
          
          // Join viewer to stream room
          socket.join(`stream:${streamId}`);
          
          // Add viewer to stream
          await stream.addViewer(socket.user.id);
          
          // Notify broadcaster that a new viewer has joined
          this.io.to(`stream:${streamId}:broadcast`).emit('webrtc:viewer_joined', {
            streamId,
            viewerId: socket.user.id,
            viewerSocketId: socket.id
          });
          
          console.log(`User ${socket.user.username} joined stream ${streamId} as viewer`);
        } catch (err) {
          console.error('Error joining stream:', err);
          socket.emit('error', { message: 'Error joining stream' });
        }
      });
      
      // Handle WebRTC signaling
      socket.on('webrtc:signal', (data) => {
        try {
          const { streamId, signal, targetId } = data;
          
          // Forward the signal to the target peer
          this.io.to(targetId).emit('webrtc:signal', {
            streamId,
            signal,
            fromId: socket.id,
            fromUserId: socket.user.id
          });
          
          console.log(`WebRTC signal forwarded from ${socket.id} to ${targetId}`);
        } catch (err) {
          console.error('Error handling WebRTC signal:', err);
          socket.emit('error', { message: 'Error handling WebRTC signal' });
        }
      });
      
      // Handle stream ending
      socket.on('webrtc:end_broadcast', async (data) => {
        try {
          const { streamId } = data;
          
          // Find stream
          const stream = await Stream.findById(streamId);
          
          if (!stream) {
            socket.emit('error', { message: 'Stream not found' });
            return;
          }
          
          // Check if user is stream owner
          if (stream.user.toString() !== socket.user.id) {
            socket.emit('error', { message: 'Only stream owner can end broadcast' });
            return;
          }
          
          // Remove broadcaster info
          this.streams.delete(streamId);
          
          // End the stream in database
          await stream.endStream();
          
          // Notify all viewers that broadcast has ended
          this.io.to(`stream:${streamId}`).emit('webrtc:broadcast_ended', {
            streamId
          });
          
          console.log(`User ${socket.user.username} ended broadcast for stream ${streamId}`);
        } catch (err) {
          console.error('Error ending broadcast:', err);
          socket.emit('error', { message: 'Error ending broadcast' });
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          // Check if user was broadcasting any streams
          for (const [streamId, info] of this.streams.entries()) {
            if (info.socketId === socket.id) {
              // Find stream
              const stream = await Stream.findById(streamId);
              
              if (stream) {
                // End the stream in database
                await stream.endStream();
                
                // Notify all viewers that broadcast has ended
                this.io.to(`stream:${streamId}`).emit('webrtc:broadcast_ended', {
                  streamId
                });
                
                // Remove broadcaster info
                this.streams.delete(streamId);
                
                console.log(`Broadcaster ${socket.user.username} disconnected, ended stream ${streamId}`);
              }
            }
          }
        } catch (err) {
          console.error('Error handling broadcaster disconnect:', err);
        }
      });
    });
  }
}

module.exports = WebRTCService;

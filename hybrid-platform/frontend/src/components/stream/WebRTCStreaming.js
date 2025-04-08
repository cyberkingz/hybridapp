// Frontend integration for WebRTC streaming
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const WebRTCStreamingComponent = () => {
  const { streamId } = useParams();
  const [socket, setSocket] = useState(null);
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [isBroadcaster, setIsBroadcaster] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState(null);
  
  const localVideoRef = useRef(null);
  const peersRef = useRef({});
  
  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token'); // Get auth token
    
    // Connect to socket server
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setSocket(newSocket);
      setIsConnected(true);
    });
    
    newSocket.on('error', (data) => {
      console.error('Socket error:', data.message);
      setError(data.message);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);
  
  // Handle stream setup
  useEffect(() => {
    if (!socket || !streamId) return;
    
    // Join stream room
    socket.emit('stream:join', streamId);
    
    // Listen for viewer count updates
    socket.on('stream:viewer_count', (data) => {
      setViewerCount(data.count);
    });
    
    // Listen for WebRTC signals
    socket.on('webrtc:signal', handleIncomingSignal);
    
    // Listen for broadcast started event
    socket.on('webrtc:broadcast_started', handleBroadcastStarted);
    
    // Listen for broadcast ended event
    socket.on('webrtc:broadcast_ended', handleBroadcastEnded);
    
    // Listen for new viewer joined event
    socket.on('webrtc:viewer_joined', handleViewerJoined);
    
    return () => {
      // Leave stream room
      socket.emit('stream:leave', streamId);
      
      // Remove event listeners
      socket.off('stream:viewer_count');
      socket.off('webrtc:signal');
      socket.off('webrtc:broadcast_started');
      socket.off('webrtc:broadcast_ended');
      socket.off('webrtc:viewer_joined');
      
      // Stop local stream if broadcasting
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      Object.values(peersRef.current).forEach(peer => {
        if (peer.peer) {
          peer.peer.destroy();
        }
      });
    };
  }, [socket, streamId]);
  
  // Start broadcasting
  const startBroadcasting = async () => {
    try {
      // Get user media
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Set local stream
      setStream(mediaStream);
      
      // Set video element source
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
      
      // Notify server that broadcast is starting
      socket.emit('webrtc:start_broadcast', { streamId });
      
      // Set as broadcaster
      setIsBroadcaster(true);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera or microphone');
    }
  };
  
  // End broadcasting
  const endBroadcasting = () => {
    // Notify server that broadcast is ending
    socket.emit('webrtc:end_broadcast', { streamId });
    
    // Stop local stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Reset state
    setStream(null);
    setIsBroadcaster(false);
  };
  
  // Join stream as viewer
  const joinAsViewer = () => {
    socket.emit('webrtc:join_stream', { streamId });
  };
  
  // Handle incoming WebRTC signal
  const handleIncomingSignal = (data) => {
    const { fromId, signal } = data;
    
    // If we're the broadcaster and this is a new viewer
    if (isBroadcaster) {
      // Check if we already have a peer for this viewer
      if (!peersRef.current[fromId]) {
        // Create new peer for this viewer
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream
        });
        
        // Set up peer events
        peer.on('signal', (signal) => {
          // Send signal back to viewer
          socket.emit('webrtc:signal', {
            streamId,
            signal,
            targetId: fromId
          });
        });
        
        // Signal the peer with the received signal
        peer.signal(signal);
        
        // Store peer reference
        peersRef.current[fromId] = { peer, id: fromId };
        
        // Update peers state
        setPeers(prevPeers => ({
          ...prevPeers,
          [fromId]: { peer, id: fromId }
        }));
      } else {
        // Signal existing peer
        peersRef.current[fromId].peer.signal(signal);
      }
    } 
    // If we're a viewer and this is from the broadcaster
    else {
      // Check if we already have a peer for the broadcaster
      if (!peersRef.current[fromId]) {
        // Create new peer for the broadcaster
        const peer = new Peer({
          initiator: true,
          trickle: false
        });
        
        // Set up peer events
        peer.on('signal', (signal) => {
          // Send signal to broadcaster
          socket.emit('webrtc:signal', {
            streamId,
            signal,
            targetId: fromId
          });
        });
        
        peer.on('stream', (remoteStream) => {
          // Set video element source with remote stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = remoteStream;
          }
        });
        
        // Signal the peer with the received signal
        peer.signal(signal);
        
        // Store peer reference
        peersRef.current[fromId] = { peer, id: fromId };
        
        // Update peers state
        setPeers(prevPeers => ({
          ...prevPeers,
          [fromId]: { peer, id: fromId }
        }));
      } else {
        // Signal existing peer
        peersRef.current[fromId].peer.signal(signal);
      }
    }
  };
  
  // Handle broadcast started event
  const handleBroadcastStarted = (data) => {
    console.log('Broadcast started:', data);
    // Join as viewer if we're not the broadcaster
    if (data.broadcasterId !== socket.id) {
      joinAsViewer();
    }
  };
  
  // Handle broadcast ended event
  const handleBroadcastEnded = (data) => {
    console.log('Broadcast ended:', data);
    
    // Clear video if we're a viewer
    if (!isBroadcaster && localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    // Close all peer connections
    Object.values(peersRef.current).forEach(peer => {
      if (peer.peer) {
        peer.peer.destroy();
      }
    });
    
    // Reset peers
    peersRef.current = {};
    setPeers({});
  };
  
  // Handle new viewer joined event
  const handleViewerJoined = (data) => {
    console.log('Viewer joined:', data);
    
    // If we're the broadcaster, create a peer for the new viewer
    if (isBroadcaster && stream) {
      const { viewerId, viewerSocketId } = data;
      
      // Create new peer for this viewer
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream
      });
      
      // Set up peer events
      peer.on('signal', (signal) => {
        // Send signal to viewer
        socket.emit('webrtc:signal', {
          streamId,
          signal,
          targetId: viewerSocketId
        });
      });
      
      // Store peer reference
      peersRef.current[viewerSocketId] = { peer, id: viewerSocketId };
      
      // Update peers state
      setPeers(prevPeers => ({
        ...prevPeers,
        [viewerSocketId]: { peer, id: viewerSocketId }
      }));
    }
  };
  
  return (
    <div className="webrtc-streaming">
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      <div className="video-container">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted={isBroadcaster} // Mute if broadcasting to prevent feedback
        />
      </div>
      
      <div className="stream-info">
        <div className="viewer-count">
          {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
        </div>
        
        {isConnected && (
          <div className="stream-controls">
            {!isBroadcaster && !stream ? (
              <button onClick={joinAsViewer}>
                Join Stream
              </button>
            ) : isBroadcaster ? (
              <button onClick={endBroadcasting}>
                End Broadcast
              </button>
            ) : (
              <button onClick={() => {
                // Leave stream
                socket.emit('stream:leave', streamId);
                
                // Clear video
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = null;
                }
                
                // Close all peer connections
                Object.values(peersRef.current).forEach(peer => {
                  if (peer.peer) {
                    peer.peer.destroy();
                  }
                });
                
                // Reset peers
                peersRef.current = {};
                setPeers({});
              }}>
                Leave Stream
              </button>
            )}
            
            {!isBroadcaster && !stream && (
              <button onClick={startBroadcasting}>
                Start Broadcasting
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRTCStreamingComponent;

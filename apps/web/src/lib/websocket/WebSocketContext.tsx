'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  WebSocketContextValue,
  ConnectionStatus,
  RoomJoinData,
  RoomLeaveData,
} from './types';

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoConnect?: boolean;
}

export function WebSocketProvider({
  children,
  url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  autoConnect = true,
}: WebSocketProviderProps) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectionStatus === 'connected';

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    // Get JWT token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      // User not logged in yet - silently skip WebSocket connection
      setConnectionStatus('disconnected');
      return;
    }

    // Prevent creating a new socket if one already exists or is connecting
    if (socketRef.current) {
      return;
    }

    console.log('🔌 WebSocket: Initializing connection to', url);
    setConnectionStatus('connecting');

    // Create socket instance
    const newSocket = io(url, {
      // forceNew: true, // Use this if you still face issues
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ WebSocket: Connected', newSocket.id);
      setConnectionStatus('connected');
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket: Disconnected', reason);
      setConnectionStatus('disconnected');

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ WebSocket: Connection error', err.message);
      setConnectionStatus('error');
      setError(err.message);
    });

    newSocket.on('connection:error', (data) => {
      console.error('❌ WebSocket: Server error', data.message);
      setError(data.message);
    });

    // Event logging (development only)
    if (process.env.NODE_ENV === 'development') {
      // Task events
      newSocket.on('task:created', (data) => {
        console.log('📋 WebSocket: Task created', data);
      });

      newSocket.on('task:updated', (data) => {
        console.log('📝 WebSocket: Task updated', data);
      });

      newSocket.on('task:deleted', (data) => {
        console.log('🗑️ WebSocket: Task deleted', data);
      });

      newSocket.on('task:moved', (data) => {
        console.log('🔄 WebSocket: Task moved', data);
      });

      // Comment events
      newSocket.on('comment:created', (data) => {
        console.log('💬 WebSocket: Comment created', data);
      });

      newSocket.on('comment:updated', (data) => {
        console.log('✏️ WebSocket: Comment updated', data);
      });

      newSocket.on('comment:deleted', (data) => {
        console.log('🗑️ WebSocket: Comment deleted', data);
      });

      // Presence events
      newSocket.on('presence:user_online', (data) => {
        console.log('👤 WebSocket: User online', data.name);
      });

      newSocket.on('presence:user_offline', (data) => {
        console.log('👤 WebSocket: User offline', data.name);
      });

      // Typing events
      newSocket.on('typing:user_typing', (data) => {
        console.log('⌨️ WebSocket: User typing', data.name);
      });
    }

    // Cleanup on unmount
    return () => {
      console.log('🔌 WebSocket: Cleanup initiated');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url, autoConnect]);

  // Room management
  const joinRoom = useCallback(
    (data: RoomJoinData) => {
      if (!socketRef.current || !isConnected) {
        console.warn('🔌 WebSocket: Cannot join room - not connected');
        return;
      }

      socketRef.current.emit('room:join', data);
      console.log('📥 WebSocket: Joined rooms', data);
    },
    [isConnected]
  );

  const leaveRoom = useCallback(
    (data: RoomLeaveData) => {
      if (!socketRef.current || !isConnected) {
        console.warn('🔌 WebSocket: Cannot leave room - not connected');
        return;
      }

      socketRef.current.emit('room:leave', data);
      console.log('📤 WebSocket: Left rooms', data);
    },
    [isConnected]
  );

  // Presence
  const updatePresence = useCallback(
    (status: 'online' | 'away' | 'offline') => {
      if (!socketRef.current || !isConnected) return;

      socketRef.current.emit('presence:update', { status });
      console.log('👤 WebSocket: Updated presence', status);
    },
    [isConnected]
  );

  const setViewingTask = useCallback(
    (taskId: string) => {
      if (!socketRef.current || !isConnected) return;

      socketRef.current.emit('presence:viewing', { taskId });
      console.log('👁️ WebSocket: Viewing task', taskId);
    },
    [isConnected]
  );

  // Typing indicators
  const startTyping = useCallback(
    (taskId: string, commentId?: string) => {
      if (!socketRef.current || !isConnected) return;

      socketRef.current.emit('typing:start', { taskId, commentId });
    },
    [isConnected]
  );

  const stopTyping = useCallback(
    (taskId: string, commentId?: string) => {
      if (!socketRef.current || !isConnected) return;

      socketRef.current.emit('typing:stop', { taskId, commentId });
    },
    [isConnected]
  );

  const value: WebSocketContextValue = {
    socket: socketRef.current, // Provide the socket from the ref
    isConnected,
    connectionStatus,
    error,
    joinRoom,
    leaveRoom,
    updatePresence,
    setViewingTask,
    startTyping,
    stopTyping,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

// Custom hook to use WebSocket context
export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }

  return context;
}

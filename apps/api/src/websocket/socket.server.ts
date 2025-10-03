import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { TypedSocketServer, TypedSocket } from './socket.types';
import { socketAuthMiddleware } from './socket.auth';
import {
  handleRoomJoin,
  handleRoomLeave,
  handlePresenceUpdate,
  handlePresenceViewing,
  handleTypingStart,
  handleTypingStop,
} from './socket.handlers';
import { setupRedisAdapter } from './socket.redis';

/**
 * Initialize Socket.io server
 * @param httpServer - HTTP server instance
 * @returns TypedSocketServer instance
 */
export async function initializeSocketServer(httpServer: HttpServer): Promise<TypedSocketServer> {
  const io: TypedSocketServer = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Ping/Pong configuration
    pingInterval: 25000, // 25 seconds
    pingTimeout: 20000, // 20 seconds
    // Connection configuration
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  console.log('🔌 Initializing Socket.io server...');

  // Setup Redis adapter for multi-server support
  await setupRedisAdapter(io);

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Connection event
  io.on('connection', (socket: TypedSocket) => {
    const user = socket.data;
    console.log(`✅ Client connected: ${user.email} (${socket.id})`);

    // Join user's personal room
    const userRoom = `user:${user.userId}`;
    socket.join(userRoom);

    // Emit user online status
    socket.broadcast.emit('presence:user_online', {
      userId: user.userId,
      name: user.email, // TODO: Get actual user name from database
      status: 'online',
      timestamp: new Date().toISOString(),
    });

    // Room management
    socket.on('room:join', (data) => handleRoomJoin(socket, data));
    socket.on('room:leave', (data) => handleRoomLeave(socket, data));

    // Presence events
    socket.on('presence:update', (data) => handlePresenceUpdate(socket, data));
    socket.on('presence:viewing', (data) => handlePresenceViewing(socket, data));

    // Typing indicators
    socket.on('typing:start', (data) => handleTypingStart(socket, data));
    socket.on('typing:stop', (data) => handleTypingStop(socket, data));

    // Disconnection event
    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${user.email} (${socket.id}) - Reason: ${reason}`);

      // Emit user offline status
      socket.broadcast.emit('presence:user_offline', {
        userId: user.userId,
        name: user.email,
        status: 'offline',
        timestamp: new Date().toISOString(),
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${user.email}:`, error);
    });
  });

  // Global error handling
  io.engine.on('connection_error', (err) => {
    console.error('Socket.io connection error:', {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  console.log('✅ Socket.io server initialized');

  return io;
}

/**
 * Get Socket.io server instance
 * Singleton pattern to ensure only one instance
 */
let socketServer: TypedSocketServer | null = null;

export function getSocketServer(): TypedSocketServer {
  if (!socketServer) {
    throw new Error('Socket server not initialized. Call initializeSocketServer first.');
  }
  return socketServer;
}

export function setSocketServer(server: TypedSocketServer) {
  socketServer = server;
}

import type { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import type { SocketData } from './socket.types';

/**
 * Socket.io authentication middleware
 * Verifies JWT token from handshake auth or query params
 */
export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    // Get token from auth object or query parameters
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token as string;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = verifyToken(token);

    if (!decoded.userId || !decoded.email) {
      return next(new Error('Authentication error: Invalid token payload'));
    }

    // Attach user data to socket
    socket.data.userId = decoded.userId;
    socket.data.email = decoded.email;

    console.log(`✅ WebSocket authenticated: ${decoded.email} (${decoded.userId})`);

    next();
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    next(new Error('Authentication error: Invalid or expired token'));
  }
}

/**
 * Get authenticated user from socket
 */
export function getSocketUser(socket: Socket): SocketData {
  return {
    userId: socket.data.userId,
    email: socket.data.email,
  };
}

/**
 * Check if socket has access to workspace
 * @param socket - Socket instance
 * @param workspaceId - Workspace ID to check
 * @returns Promise<boolean>
 */
export async function canAccessWorkspace(
  _socket: Socket,
  _workspaceId: string
): Promise<boolean> {
  // TODO: Implement workspace access check with database
  // For now, return true (all authenticated users can access)
  // This should be implemented with proper workspace membership check
  return true;
}

/**
 * Check if socket has access to project
 * @param socket - Socket instance
 * @param projectId - Project ID to check
 * @returns Promise<boolean>
 */
export async function canAccessProject(
  _socket: Socket,
  _projectId: string
): Promise<boolean> {
  // TODO: Implement project access check with database
  // For now, return true (all authenticated users can access)
  // This should be implemented with proper project membership check
  return true;
}

/**
 * Check if socket has access to task
 * @param socket - Socket instance
 * @param taskId - Task ID to check
 * @returns Promise<boolean>
 */
export async function canAccessTask(
  _socket: Socket,
  _taskId: string
): Promise<boolean> {
  // TODO: Implement task access check with database
  // For now, return true (all authenticated users can access)
  // This should be implemented with proper task access check
  return true;
}

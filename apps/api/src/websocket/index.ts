/**
 * WebSocket Module
 * Exports all WebSocket-related functionality
 */

export * from './socket.types';
export * from './socket.auth';
export * from './socket.handlers';
export * from './socket.server';
export * from './socket.redis';
export * from './socket.events';
export { initializeSocketServer, getSocketServer, setSocketServer } from './socket.server';
export { setupRedisAdapter, checkRedisConnection } from './socket.redis';
export {
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskDeleted,
  emitTaskMoved,
  emitCommentCreated,
  emitCommentUpdated,
  emitCommentDeleted,
  emitMemberJoined,
  emitMemberLeft,
  emitMemberRoleChanged,
} from './socket.events';

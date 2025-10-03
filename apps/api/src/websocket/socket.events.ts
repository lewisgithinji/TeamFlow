import { getSocketServer } from './socket.server';
import { RoomNames } from './socket.types';
import type {
  TaskEvent,
  CommentEvent,
  MemberEvent,
} from './socket.types';

/**
 * Event emitter utilities for real-time updates
 * These functions are called from service layers to broadcast events
 */

/**
 * Emit task created event
 */
export function emitTaskCreated(event: TaskEvent): void {
  try {
    const io = getSocketServer();
    const room = RoomNames.project(event.projectId);

    io.to(room).emit('task:created', event);

    console.log(`📤 Emitted task:created to project ${event.projectId}`);
  } catch (error) {
    console.error('Error emitting task:created event:', error);
  }
}

/**
 * Emit task updated event
 */
export function emitTaskUpdated(event: TaskEvent): void {
  try {
    const io = getSocketServer();
    const taskRoom = RoomNames.task(event.taskId);
    const projectRoom = RoomNames.project(event.projectId);

    // Emit to both task and project rooms
    io.to(taskRoom).to(projectRoom).emit('task:updated', event);

    console.log(`📤 Emitted task:updated for task ${event.taskId}`);
  } catch (error) {
    console.error('Error emitting task:updated event:', error);
  }
}

/**
 * Emit task deleted event
 */
export function emitTaskDeleted(event: TaskEvent): void {
  try {
    const io = getSocketServer();
    const projectRoom = RoomNames.project(event.projectId);

    io.to(projectRoom).emit('task:deleted', event);

    console.log(`📤 Emitted task:deleted for task ${event.taskId}`);
  } catch (error) {
    console.error('Error emitting task:deleted event:', error);
  }
}

/**
 * Emit task moved event (status change)
 */
export function emitTaskMoved(event: TaskEvent): void {
  try {
    const io = getSocketServer();
    const projectRoom = RoomNames.project(event.projectId);

    io.to(projectRoom).emit('task:moved', event);

    console.log(`📤 Emitted task:moved for task ${event.taskId}`);
  } catch (error) {
    console.error('Error emitting task:moved event:', error);
  }
}

/**
 * Emit comment created event
 */
export function emitCommentCreated(event: CommentEvent): void {
  try {
    const io = getSocketServer();
    const taskRoom = RoomNames.task(event.taskId);

    io.to(taskRoom).emit('comment:created', event);

    console.log(`📤 Emitted comment:created for task ${event.taskId}`);
  } catch (error) {
    console.error('Error emitting comment:created event:', error);
  }
}

/**
 * Emit comment updated event
 */
export function emitCommentUpdated(event: CommentEvent): void {
  try {
    const io = getSocketServer();
    const taskRoom = RoomNames.task(event.taskId);

    io.to(taskRoom).emit('comment:updated', event);

    console.log(`📤 Emitted comment:updated for comment ${event.commentId}`);
  } catch (error) {
    console.error('Error emitting comment:updated event:', error);
  }
}

/**
 * Emit comment deleted event
 */
export function emitCommentDeleted(event: CommentEvent): void {
  try {
    const io = getSocketServer();
    const taskRoom = RoomNames.task(event.taskId);

    io.to(taskRoom).emit('comment:deleted', event);

    console.log(`📤 Emitted comment:deleted for comment ${event.commentId}`);
  } catch (error) {
    console.error('Error emitting comment:deleted event:', error);
  }
}

/**
 * Emit member joined event
 */
export function emitMemberJoined(event: MemberEvent): void {
  try {
    const io = getSocketServer();
    const workspaceRoom = RoomNames.workspace(event.workspaceId);

    io.to(workspaceRoom).emit('member:joined', event);

    console.log(`📤 Emitted member:joined for workspace ${event.workspaceId}`);
  } catch (error) {
    console.error('Error emitting member:joined event:', error);
  }
}

/**
 * Emit member left event
 */
export function emitMemberLeft(event: MemberEvent): void {
  try {
    const io = getSocketServer();
    const workspaceRoom = RoomNames.workspace(event.workspaceId);

    io.to(workspaceRoom).emit('member:left', event);

    console.log(`📤 Emitted member:left for workspace ${event.workspaceId}`);
  } catch (error) {
    console.error('Error emitting member:left event:', error);
  }
}

/**
 * Emit member role changed event
 */
export function emitMemberRoleChanged(event: MemberEvent): void {
  try {
    const io = getSocketServer();
    const workspaceRoom = RoomNames.workspace(event.workspaceId);

    io.to(workspaceRoom).emit('member:role_changed', event);

    console.log(`📤 Emitted member:role_changed for workspace ${event.workspaceId}`);
  } catch (error) {
    console.error('Error emitting member:role_changed event:', error);
  }
}

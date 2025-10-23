import type { AttachmentEvent, NotificationEvent, TaskEvent } from '@teamflow/types';
import { getSocketServer } from './socket.server';
import { RoomNames } from './socket.types';

/**
 * Emits a 'notification:new' event to a specific user's room.
 * @param notification - The notification object to send.
 */
export function emitNotification(notification: NotificationEvent['notification']) {
  try {
    const io = getSocketServer();
    io.to(RoomNames.user(notification.userId)).emit('notification:new', notification);
  } catch (error) {
    console.error('Failed to emit notification:new event', {
      error,
      userId: notification.userId,
    });
  }
}

/**
 * Emits an 'attachment:added' event to the project room
 * @param data - Attachment event data
 */
export function emitAttachmentAdded(data: AttachmentEvent) {
  try {
    const io = getSocketServer();
    io.to(RoomNames.project(data.projectId)).emit('attachment:added', data);
  } catch (error) {
    console.error('Failed to emit attachment:added event', {
      error,
      attachmentId: data.attachmentId,
      taskId: data.taskId,
    });
  }
}

/**
 * Emits an 'attachment:deleted' event to the project room
 * @param data - Attachment deletion event data
 */
export function emitAttachmentDeleted(data: AttachmentEvent) {
  try {
    const io = getSocketServer();
    io.to(RoomNames.project(data.projectId)).emit('attachment:deleted', data);
  } catch (error) {
    console.error('Failed to emit attachment:deleted event', {
      error,
      attachmentId: data.attachmentId,
    });
  }
}

/**
 * Emits a 'task:created' event to the project room.
 * @param data - Task creation event data.
 */
export function emitTaskCreated(data: TaskEvent) {
  try {
    const io = getSocketServer();
    io.to(RoomNames.project(data.projectId)).emit('task:created', data);
  } catch (error) {
    console.error('Failed to emit task:created event', {
      error,
      taskId: data.taskId,
    });
  }
}

/**
 * Emits a 'task:updated' event to the project room.
 * @param data - Task update event data.
 */
export function emitTaskUpdated(data: TaskEvent) {
  try {
    const io = getSocketServer();
    io.to(RoomNames.project(data.projectId)).emit('task:updated', data);
  } catch (error) {
    console.error('Failed to emit task:updated event', {
      error,
      taskId: data.taskId,
    });
  }
}

/**
 * Emits a 'task:deleted' event to the project room.
 * @param data - Task deletion event data.
 */
export function emitTaskDeleted(data: TaskEvent) {
  try {
    const io = getSocketServer();
    io.to(RoomNames.project(data.projectId)).emit('task:deleted', data);
  } catch (error) {
    console.error('Failed to emit task:deleted event', {
      error,
      taskId: data.taskId,
    });
  }
}

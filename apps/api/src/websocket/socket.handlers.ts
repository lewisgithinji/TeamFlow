import type { TypedSocket } from './socket.types';
import { RoomNames } from './socket.types';
import { canAccessWorkspace, canAccessProject, canAccessTask } from './socket.auth';
import { redis } from '../redis';
import { prisma } from '@teamflow/database';

/**
 * Handle room join requests
 */
export async function handleRoomJoin(
  socket: TypedSocket,
  data: { workspaceId?: string; projectId?: string; taskId?: string }
) {
  try {
    const user = socket.data;

    // Join workspace room
    if (data.workspaceId) {
      const hasAccess = await canAccessWorkspace(socket, data.workspaceId);
      if (hasAccess) {
        const room = RoomNames.workspace(data.workspaceId);
        await socket.join(room);
        console.log(`📥 ${user.email} joined workspace room: ${room}`);
      } else {
        socket.emit('connection:error', { message: 'Access denied to workspace' });
      }
    }

    // Join project room
    if (data.projectId) {
      const hasAccess = await canAccessProject(socket, data.projectId);
      if (hasAccess) {
        const room = RoomNames.project(data.projectId);
        await socket.join(room);
        console.log(`📥 ${user.email} joined project room: ${room}`);
      } else {
        socket.emit('connection:error', { message: 'Access denied to project' });
      }
    }

    // Join task room
    if (data.taskId) {
      const hasAccess = await canAccessTask(socket, data.taskId);
      if (hasAccess) {
        const room = RoomNames.task(data.taskId);
        await socket.join(room);
        socket.app.logger.info(`User ${user.email} joined task room`, { room });
      } else {
        socket.emit('connection:error', { message: 'Access denied to task' });
      }
    }
  } catch (error) {
    console.error('Error joining room:', error);
    socket.emit('connection:error', { message: 'Failed to join room' });
  }
}

/**
 * Fetches user details for a list of IDs and broadcasts the presence list to a room.
 * @param taskId The ID of the task.
 * @param socket The socket instance to broadcast from.
 */
export async function broadcastViewingUsers(taskId: string, socket: TypedSocket) {
  const room = RoomNames.task(taskId);
  const presenceKey = `presence:task:${taskId}`;

  try {
    const userIds = await redis.smembers(presenceKey);

    if (userIds.length === 0) {
      // If no one is viewing, send an empty list
      socket.server.to(room).emit('presence:users_viewing', { taskId, users: [] });
      return;
    }

    // Fetch user details from the database
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userPresenceList = users.map((u) => ({
      userId: u.id,
      name: u.name,
      avatar: u.avatar,
    }));

    socket.server.to(room).emit('presence:users_viewing', { taskId, users: userPresenceList });
  } catch (error) {
    socket.app.logger.error('Error broadcasting viewing users', { error, taskId });
  }
}

/**
 * Handle room leave requests
 */
export async function handleRoomLeave(
  socket: TypedSocket,
  data: { workspaceId?: string; projectId?: string; taskId?: string }
) {
  try {
    const user = socket.data;

    // Leave workspace room
    if (data.workspaceId) {
      const room = RoomNames.workspace(data.workspaceId);
      await socket.leave(room);
      socket.app.logger.info(`User ${user.email} left workspace room`, { room });
    }

    // Leave project room
    if (data.projectId) {
      const room = RoomNames.project(data.projectId);
      await socket.leave(room);
      socket.app.logger.info(`User ${user.email} left project room`, { room });
    }

    // Leave task room
    if (data.taskId) {
      const room = RoomNames.task(data.taskId);
      await socket.leave(room);
      socket.app.logger.info(`User ${user.email} left task room`, { room });

      // If the user was viewing this task, remove them from the presence list
      if (socket.data.viewingTaskId === data.taskId) {
        await handlePresenceViewing(socket, { taskId: null }); // Pass null to signify leaving
      }
    }
  } catch (error) {
    console.error('Error leaving room:', error);
  }
}

/**
 * Handle presence updates
 */
export function handlePresenceUpdate(
  socket: TypedSocket,
  data: { status: 'online' | 'away' | 'offline' }
) {
  try {
    const user = socket.data;

    // Broadcast presence to all rooms the user is in
    socket.broadcast.emit('presence:user_online', {
      userId: user.userId,
      name: user.email, // TODO: Get actual user name from database
      status: data.status,
      timestamp: new Date().toISOString(),
    });

    socket.app.logger.info(`User ${user.email} presence updated`, { status: data.status });
  } catch (error) {
    console.error('Error updating presence:', error);
  }
}

/**
 * Handles a user starting or stopping to view a task.
 * Manages the presence state in Redis and broadcasts updates.
 */
export async function handlePresenceViewing(
  socket: TypedSocket,
  data: { taskId: string | null } // null means user stopped viewing
) {
  try {
    const { userId } = socket.data;
    const oldTaskId = socket.data.viewingTaskId;
    const newTaskId = data.taskId;

    // If user was viewing a task, remove them from the old presence set
    if (oldTaskId) {
      const oldPresenceKey = `presence:task:${oldTaskId}`;
      await redis.srem(oldPresenceKey, userId);
      socket.data.viewingTaskId = undefined;
      // Broadcast the update to the old room
      await broadcastViewingUsers(oldTaskId, socket);
    }

    // If user is starting to view a new task, add them to the new presence set
    if (newTaskId) {
      const newPresenceKey = `presence:task:${newTaskId}`;
      await redis.sadd(newPresenceKey, userId);
      socket.data.viewingTaskId = newTaskId;
      // Broadcast the update to the new room
      await broadcastViewingUsers(newTaskId, socket);
    }

    socket.app.logger.info(`User ${userId} presence viewing updated`, { oldTaskId, newTaskId });
  } catch (error) {
    socket.app.logger.error('Error handling presence viewing', { error });
  }
}

/**
 * Handles socket disconnection by cleaning up presence state.
 */
export async function handleDisconnect(socket: TypedSocket) {
  try {
    const { userId, viewingTaskId } = socket.data;

    // If the user was viewing a task, remove them from the presence list
    if (viewingTaskId) {
      const presenceKey = `presence:task:${viewingTaskId}`;
      await redis.srem(presenceKey, userId);
      // Broadcast the final update to the room
      await broadcastViewingUsers(viewingTaskId, socket);
      socket.app.logger.info(`Cleaned up presence for ${userId} from task ${viewingTaskId}`);
    }
  } catch (error) {
    console.error('Error handling presence viewing:', error);
  }
}

/**
 * Handle typing start
 */
export function handleTypingStart(
  socket: TypedSocket,
  data: { taskId: string; commentId?: string }
) {
  try {
    const user = socket.data;
    const room = RoomNames.task(data.taskId);

    // Notify others in the task room
    socket.to(room).emit('typing:user_typing', {
      userId: user.userId,
      name: user.email, // TODO: Get actual user name
      taskId: data.taskId,
      commentId: data.commentId,
      timestamp: new Date().toISOString(),
    });

    socket.app.logger.info(`User ${user.email} started typing`, { task: data.taskId });
  } catch (error) {
    console.error('Error handling typing start:', error);
  }
}

/**
 * Handle typing stop
 */
export function handleTypingStop(
  socket: TypedSocket,
  data: { taskId: string; commentId?: string }
) {
  try {
    const user = socket.data;
    const room = RoomNames.task(data.taskId);

    // Notify others in the task room
    socket.to(room).emit('typing:user_stopped', {
      userId: user.userId,
      name: user.email, // TODO: Get actual user name
      taskId: data.taskId,
      commentId: data.commentId,
      timestamp: new Date().toISOString(),
    });

    socket.app.logger.info(`User ${user.email} stopped typing`, { task: data.taskId });
  } catch (error) {
    console.error('Error handling typing stop:', error);
  }
}

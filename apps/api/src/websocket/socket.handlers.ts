import type { TypedSocket } from './socket.types';
import { RoomNames } from './socket.types';
import { canAccessWorkspace, canAccessProject, canAccessTask } from './socket.auth';

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
        console.log(`📥 ${user.email} joined task room: ${room}`);

        // Emit presence to other users viewing this task
        socket.to(room).emit('presence:users_viewing', {
          taskId: data.taskId,
          users: [], // TODO: Get list of users in room
        });
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
      console.log(`📤 ${user.email} left workspace room: ${room}`);
    }

    // Leave project room
    if (data.projectId) {
      const room = RoomNames.project(data.projectId);
      await socket.leave(room);
      console.log(`📤 ${user.email} left project room: ${room}`);
    }

    // Leave task room
    if (data.taskId) {
      const room = RoomNames.task(data.taskId);
      await socket.leave(room);
      console.log(`📤 ${user.email} left task room: ${room}`);

      // Notify others that user stopped viewing
      socket.to(room).emit('presence:users_viewing', {
        taskId: data.taskId,
        users: [], // TODO: Get updated list of users in room
      });
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

    console.log(`👤 ${user.email} presence: ${data.status}`);
  } catch (error) {
    console.error('Error updating presence:', error);
  }
}

/**
 * Handle user viewing a task
 */
export function handlePresenceViewing(socket: TypedSocket, data: { taskId: string }) {
  try {
    const user = socket.data;
    const room = RoomNames.task(data.taskId);

    // Notify others in the task room
    socket.to(room).emit('presence:users_viewing', {
      taskId: data.taskId,
      users: [], // TODO: Get list of users viewing this task
    });

    console.log(`👁️ ${user.email} viewing task: ${data.taskId}`);
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

    console.log(`⌨️ ${user.email} typing in task: ${data.taskId}`);
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

    console.log(`⌨️ ${user.email} stopped typing in task: ${data.taskId}`);
  } catch (error) {
    console.error('Error handling typing stop:', error);
  }
}

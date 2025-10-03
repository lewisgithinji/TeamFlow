'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import type {
  TaskEvent,
  CommentEvent,
  MemberEvent,
  PresenceEvent,
  TypingEvent,
  UsersViewingEvent,
} from './types';

/**
 * Hook to listen to specific WebSocket events
 */
export function useWebSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  dependencies: any[] = []
) {
  const { socket, isConnected } = useWebSocket();
  const handlerRef = useRef(handler);

  // Update handler ref when it changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const eventHandler = (data: T) => {
      handlerRef.current(data);
    };

    socket.on(event, eventHandler);

    return () => {
      socket.off(event, eventHandler);
    };
  }, [socket, isConnected, event, ...dependencies]);
}

/**
 * Hook to listen to task events
 */
export function useTaskEvents(callbacks: {
  onTaskCreated?: (data: TaskEvent) => void;
  onTaskUpdated?: (data: TaskEvent) => void;
  onTaskDeleted?: (data: TaskEvent) => void;
  onTaskMoved?: (data: TaskEvent) => void;
}) {
  useWebSocketEvent('task:created', callbacks.onTaskCreated || (() => {}));
  useWebSocketEvent('task:updated', callbacks.onTaskUpdated || (() => {}));
  useWebSocketEvent('task:deleted', callbacks.onTaskDeleted || (() => {}));
  useWebSocketEvent('task:moved', callbacks.onTaskMoved || (() => {}));
}

/**
 * Hook to listen to comment events
 */
export function useCommentEvents(callbacks: {
  onCommentCreated?: (data: CommentEvent) => void;
  onCommentUpdated?: (data: CommentEvent) => void;
  onCommentDeleted?: (data: CommentEvent) => void;
}) {
  useWebSocketEvent('comment:created', callbacks.onCommentCreated || (() => {}));
  useWebSocketEvent('comment:updated', callbacks.onCommentUpdated || (() => {}));
  useWebSocketEvent('comment:deleted', callbacks.onCommentDeleted || (() => {}));
}

/**
 * Hook to listen to member events
 */
export function useMemberEvents(callbacks: {
  onMemberJoined?: (data: MemberEvent) => void;
  onMemberLeft?: (data: MemberEvent) => void;
  onMemberRoleChanged?: (data: MemberEvent) => void;
}) {
  useWebSocketEvent('member:joined', callbacks.onMemberJoined || (() => {}));
  useWebSocketEvent('member:left', callbacks.onMemberLeft || (() => {}));
  useWebSocketEvent('member:role_changed', callbacks.onMemberRoleChanged || (() => {}));
}

/**
 * Hook to listen to presence events
 */
export function usePresenceEvents(callbacks: {
  onUserOnline?: (data: PresenceEvent) => void;
  onUserOffline?: (data: PresenceEvent) => void;
}) {
  useWebSocketEvent('presence:user_online', callbacks.onUserOnline || (() => {}));
  useWebSocketEvent('presence:user_offline', callbacks.onUserOffline || (() => {}));
}

/**
 * Hook to track users viewing a task
 */
export function useUsersViewing(taskId: string | null) {
  const { socket, isConnected, setViewingTask } = useWebSocket();

  useEffect(() => {
    if (!taskId || !isConnected) return;

    // Notify server that we're viewing this task
    setViewingTask(taskId);

    return () => {
      // Could emit a "stopped viewing" event here if needed
    };
  }, [taskId, isConnected, setViewingTask]);
}

/**
 * Hook to handle typing indicators
 */
export function useTypingIndicator(taskId: string, commentId?: string) {
  const { startTyping, stopTyping, isConnected } = useWebSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (!isConnected || !taskId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing start
    startTyping(taskId, commentId);

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(taskId, commentId);
    }, 3000);
  }, [isConnected, taskId, commentId, startTyping, stopTyping]);

  const handleStopTyping = useCallback(() => {
    if (!isConnected || !taskId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    stopTyping(taskId, commentId);
  }, [isConnected, taskId, commentId, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    handleTyping,
    handleStopTyping,
  };
}

/**
 * Hook to auto-join rooms based on current page/context
 */
export function useAutoJoinRooms(data: {
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
}) {
  const { joinRoom, leaveRoom, isConnected } = useWebSocket();
  const previousDataRef = useRef(data);

  useEffect(() => {
    if (!isConnected) return;

    const { workspaceId, projectId, taskId } = data;
    const previous = previousDataRef.current;

    // Join new rooms
    const roomsToJoin: any = {};
    if (workspaceId && workspaceId !== previous.workspaceId) {
      roomsToJoin.workspaceId = workspaceId;
    }
    if (projectId && projectId !== previous.projectId) {
      roomsToJoin.projectId = projectId;
    }
    if (taskId && taskId !== previous.taskId) {
      roomsToJoin.taskId = taskId;
    }

    if (Object.keys(roomsToJoin).length > 0) {
      joinRoom(roomsToJoin);
    }

    // Leave old rooms
    const roomsToLeave: any = {};
    if (previous.workspaceId && previous.workspaceId !== workspaceId) {
      roomsToLeave.workspaceId = previous.workspaceId;
    }
    if (previous.projectId && previous.projectId !== projectId) {
      roomsToLeave.projectId = previous.projectId;
    }
    if (previous.taskId && previous.taskId !== taskId) {
      roomsToLeave.taskId = previous.taskId;
    }

    if (Object.keys(roomsToLeave).length > 0) {
      leaveRoom(roomsToLeave);
    }

    previousDataRef.current = data;
  }, [data.workspaceId, data.projectId, data.taskId, isConnected, joinRoom, leaveRoom]);
}

/**
 * Hook to get typing users for a task
 */
export function useTypingUsers(taskId: string) {
  const [typingUsers, setTypingUsers] = useState<
    Array<{ userId: string; name: string }>
  >([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useWebSocketEvent<TypingEvent>('typing:user_typing', (data) => {
    if (data.taskId !== taskId) return;

    // Add user to typing list
    setTypingUsers((prev) => {
      const exists = prev.find((u) => u.userId === data.userId);
      if (exists) return prev;
      return [...prev, { userId: data.userId, name: data.name }];
    });

    // Remove user after 3 seconds
    const timeout = timeoutsRef.current.get(data.userId);
    if (timeout) clearTimeout(timeout);

    const newTimeout = setTimeout(() => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      timeoutsRef.current.delete(data.userId);
    }, 3500);

    timeoutsRef.current.set(data.userId, newTimeout);
  });

  useWebSocketEvent<TypingEvent>('typing:user_stopped', (data) => {
    if (data.taskId !== taskId) return;

    setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));

    const timeout = timeoutsRef.current.get(data.userId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(data.userId);
    }
  });

  return typingUsers;
}

import type { Server as SocketServer, Socket } from 'socket.io';
import type {
  TaskEvent,
  CommentEvent,
  MemberEvent,
  PresenceEvent,
  TypingEvent,
  UsersViewingEvent,
  NotificationEvent,
  UserPresence,
  RoomJoinData,
} from '@teamflow/types';

/**
 * Socket.io event types for type-safe event handling
 */

// Client to Server events
export interface ClientToServerEvents {
  // Room management
  'room:join': (data: RoomJoinData) => void;
  'room:leave': (data: { workspaceId?: string; projectId?: string; taskId?: string }) => void;

  // User presence
  'presence:update': (data: { status: 'online' | 'away' | 'offline' }) => void;
  'presence:viewing': (data: { taskId: string }) => void;

  // Typing indicators
  'typing:start': (data: { taskId: string; commentId?: string }) => void;
  'typing:stop': (data: { taskId: string; commentId?: string }) => void;
}

// Server to Client events
export interface ServerToClientEvents {
  // Task events
  'task:created': (data: TaskEvent) => void;
  'task:updated': (data: TaskEvent) => void;
  'task:deleted': (data: TaskEvent) => void;
  'task:moved': (data: TaskEvent) => void;

  // Comment events
  'comment:created': (data: CommentEvent) => void;
  'comment:updated': (data: CommentEvent) => void;
  'comment:deleted': (data: CommentEvent) => void;

  // Member events
  'member:joined': (data: MemberEvent) => void;
  'member:left': (data: MemberEvent) => void;
  'member:role_changed': (data: MemberEvent) => void;

  // Presence events
  'presence:user_online': (data: PresenceEvent) => void;
  'presence:user_offline': (data: PresenceEvent) => void;
  'presence:users_viewing': (data: UsersViewingEvent) => void;

  // Typing events
  'typing:user_typing': (data: TypingEvent) => void;
  'typing:user_stopped': (data: TypingEvent) => void;

  // Notification events
  'notification:new': (data: NotificationEvent['notification']) => void;

  // Attachment events
  'attachment:added': (data: any) => void;
  'attachment:deleted': (data: any) => void;

  // Connection events
  'connection:error': (data: { message: string }) => void;
}

// Inter-server events (for scaling)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data (authenticated user info)
export interface SocketData {
  userId: string;
  email: string;
  viewingTaskId?: string; // Track which task the user is currently viewing
}

// Type-safe Socket.io Server
export type TypedSocketServer = SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Type-safe Socket
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Room naming utilities
export const RoomNames = {
  workspace: (workspaceId: string) => `workspace:${workspaceId}`,
  project: (projectId: string) => `project:${projectId}`,
  task: (taskId: string) => `task:${taskId}`,
  user: (userId: string) => `user:${userId}`,
} as const;

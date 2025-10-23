import type {
  TaskEvent,
  CommentEvent,
  MemberEvent,
  PresenceEvent,
  UsersViewingEvent,
  UserPresence,
  TypingEvent,
  RoomJoinData,
  RoomLeaveData,
} from '@teamflow/types';

/**
 * WebSocket Types for Frontend
 * Matches backend Socket.io event definitions
 */

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

  // Connection events
  'connection:error': (data: { message: string }) => void;
}

// WebSocket connection state
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocket context value
export interface WebSocketContextValue {
  socket: any | null; // Socket instance
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  error: string | null;

  // Room management
  joinRoom: (data: RoomJoinData) => void;
  leaveRoom: (data: RoomLeaveData) => void;

  // Presence
  updatePresence: (status: 'online' | 'away' | 'offline') => void;
  setViewingTask: (taskId: string) => void;

  // Typing indicators
  startTyping: (taskId: string, commentId?: string) => void;
  stopTyping: (taskId: string, commentId?: string) => void;
}

// Re-export shared types for easier consumption within the web app
export type { TaskEvent, CommentEvent, UsersViewingEvent, UserPresence };

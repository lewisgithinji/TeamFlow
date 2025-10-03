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

// Client to Server events
export interface ClientToServerEvents {
  // Room management
  'room:join': (data: RoomJoinData) => void;
  'room:leave': (data: RoomLeaveData) => void;

  // User presence
  'presence:update': (data: { status: 'online' | 'away' | 'offline' }) => void;
  'presence:viewing': (data: { taskId: string }) => void;

  // Typing indicators
  'typing:start': (data: { taskId: string; commentId?: string }) => void;
  'typing:stop': (data: { taskId: string; commentId?: string }) => void;
}

// Event payload types
export interface TaskEvent {
  taskId: string;
  projectId: string;
  workspaceId: string;
  task?: any; // Full task object
  updates?: any; // Partial updates
  updatedBy: {
    userId: string;
    name: string;
  };
  timestamp: string;
}

export interface CommentEvent {
  commentId: string;
  taskId: string;
  projectId: string;
  workspaceId: string;
  comment?: any; // Full comment object
  updates?: any; // Partial updates
  createdBy: {
    userId: string;
    name: string;
  };
  timestamp: string;
}

export interface MemberEvent {
  memberId: string;
  workspaceId: string;
  user: {
    userId: string;
    name: string;
    email: string;
  };
  role?: string;
  oldRole?: string;
  timestamp: string;
}

export interface PresenceEvent {
  userId: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  timestamp: string;
}

export interface UsersViewingEvent {
  taskId: string;
  users: UserPresence[];
}

export interface UserPresence {
  userId: string;
  name: string;
  avatar?: string;
}

export interface TypingEvent {
  userId: string;
  name: string;
  taskId: string;
  commentId?: string;
  timestamp: string;
}

export interface RoomJoinData {
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
}

export interface RoomLeaveData {
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
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

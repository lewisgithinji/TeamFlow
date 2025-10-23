/**
 * @file Shared WebSocket event and payload types for TeamFlow.
 * This file is the single source of truth for real-time event structures
 * used by both the frontend and backend.
 */
import type { Notification } from '@teamflow/db';

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

export interface NotificationEvent {
  notification: Notification;
  timestamp: string;
}

export interface PresenceEvent {
  userId: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  timestamp: string;
}

export interface UserPresence {
  userId: string;
  name: string;
  avatar?: string;
}

export interface UsersViewingEvent {
  taskId: string;
  users: UserPresence[];
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

import type { Task, Comment, User } from '@teamflow/database';

// Socket Event Types
export interface SocketEvents {
  // Task events
  TASK_CREATED: { taskId: string; task: Task };
  TASK_UPDATED: { taskId: string; changes: Partial<Task>; version: number };
  TASK_DELETED: { taskId: string };
  TASK_ASSIGNED: { taskId: string; userId: string };
  TASK_UNASSIGNED: { taskId: string; userId: string };
  TASK_STATUS_CHANGED: { taskId: string; oldStatus: string; newStatus: string };
  TASK_MOVED: { taskId: string; oldPosition: number; newPosition: number };

  // Comment events
  COMMENT_CREATED: { commentId: string; comment: Comment };
  COMMENT_UPDATED: { commentId: string; changes: Partial<Comment> };
  COMMENT_DELETED: { commentId: string };

  // Presence events
  USER_JOINED: { userId: string; userName: string; projectId: string };
  USER_LEFT: { userId: string; projectId: string };
  USER_TYPING: { userId: string; taskId: string };

  // Sprint events
  SPRINT_STARTED: { sprintId: string };
  SPRINT_COMPLETED: { sprintId: string };
}

// Socket Room Types
export type SocketRoom = `project:${string}` | `workspace:${string}` | `task:${string}`;

// Presence Type
export interface UserPresence {
  userId: string;
  userName: string;
  avatar: string | null;
  projectId: string;
  lastSeen: Date;
}

import type { NotificationType } from '@teamflow/database';

/**
 * Notification with user relation
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string | null;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

/**
 * Create notification input
 */
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Notification filters
 */
export interface NotificationFilters {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

/**
 * Mark notification as read input
 */
export interface MarkAsReadInput {
  notificationId: string;
  userId: string;
}

/**
 * Mark all as read input
 */
export interface MarkAllAsReadInput {
  userId: string;
}

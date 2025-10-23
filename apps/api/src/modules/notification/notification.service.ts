import { prisma, Notification, NotificationType } from '@teamflow/database';
import { NotFoundError } from '../../utils/errors';
import { emitNotificationCreated } from '../../websocket';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Converts a NotificationType enum to a camelCase key for settings.
 * e.g., 'TASK_ASSIGNED' -> 'taskAssigned'
 */
function notificationTypeToSettingKey(type: NotificationType): string {
  return type.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Creates a new notification and emits a real-time event.
 * @param data - The data for the new notification.
 * @returns The created notification.
 */
export async function createNotification(data: CreateNotificationInput): Promise<Notification> {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      linkUrl: data.linkUrl,
      metadata: data.metadata || {},
    },
  });

  // 5. Emit a real-time event to the specific user
  emitNotificationCreated(notification);

  return notification;
}

interface GetNotificationsFilters {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

/**
 * Retrieves notifications for a user with filtering and pagination.
 * @param filters - The filters to apply to the query.
 * @returns An object containing the notifications and pagination info.
 */
export async function getNotifications(filters: GetNotificationsFilters) {
  const { userId, isRead, type, limit = 50, offset = 0 } = filters;

  const where = {
    userId,
    isRead,
    type,
  };

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    hasMore: offset + notifications.length < total,
  };
}

/**
 * Marks a specific notification as read.
 * @param notificationId - The ID of the notification to mark as read.
 * @param userId - The ID of the user who owns the notification.
 * @returns The updated notification.
 */
export async function markAsRead(notificationId: string, userId: string): Promise<Notification> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  if (notification.isRead) {
    return notification; // Already read, no update needed
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Marks all unread notifications for a user as read.
 * @param userId - The ID of the user.
 * @returns An object with the count of updated notifications.
 */
export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { count: result.count };
}

/**
 * Gets the count of unread notifications for a user.
 * @param userId - The ID of the user.
 * @returns An object with the count of unread notifications.
 */
export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return { count };
}

/**
 * Deletes a notification for a user.
 * @param notificationId - The ID of the notification to delete.
 * @param userId - The ID of the user who owns the notification.
 */
export async function deleteNotification(notificationId: string, userId: string) {
  // Using updateMany with a where clause ensures a user can only delete their own notification.
  const { count } = await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });

  if (count === 0) {
    throw new NotFoundError('Notification');
  }
}

/**
 * Retrieves notification settings for a user.
 * @param userId - The ID of the user.
 * @returns The user's notification settings.
 */
export async function getNotificationSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationSettings: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user.notificationSettings;
}

/**
 * Updates notification settings for a user.
 * @param userId - The ID of the user.
 * @param settings - The new settings object.
 * @returns The updated notification settings.
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Record<string, boolean>
) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { notificationSettings: settings },
  });

  return updatedUser.notificationSettings;
}

/**
 * Deletes all notifications for a specific user.
 * @param userId - The ID of the user whose notifications will be deleted.
 * @returns An object with the count of deleted notifications.
 */
export async function deleteAllNotifications(userId: string) {
  const result = await prisma.notification.deleteMany({
    where: {
      userId,
    },
  });
  return { count: result.count };
}

import { prisma } from '@teamflow/database';
import type {
  CreateNotificationInput,
  NotificationFilters,
  MarkAsReadInput,
  MarkAllAsReadInput,
} from '../types/notification.types';

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl || null,
      metadata: input.metadata || {},
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return notification;
}

/**
 * Get notifications for a user
 */
export async function getNotifications(filters: NotificationFilters) {
  const { userId, isRead, type, limit = 50, offset = 0 } = filters;

  const where: any = {
    userId,
  };

  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  if (type) {
    where.type = type;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
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
 * Get notification by ID
 */
export async function getNotificationById(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId, // Ensure user can only access their own notifications
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return notification;
}

/**
 * Mark notification as read
 */
export async function markAsRead(input: MarkAsReadInput) {
  const { notificationId, userId } = input;

  // Verify notification belongs to user
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  const updated = await prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Mark notification as unread
 */
export async function markAsUnread(input: MarkAsReadInput) {
  const { notificationId, userId } = input;

  // Verify notification belongs to user
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  const updated = await prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: false,
      readAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(input: MarkAllAsReadInput) {
  const { userId } = input;

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
 * Delete notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  // Verify notification belongs to user
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  await prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });
}

/**
 * Get unread notification count
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

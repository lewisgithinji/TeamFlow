import type { Request, Response } from 'express';
import * as notificationService from '@teamflow/notification';

/**
 * Get notifications for current user
 * GET /api/notifications
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.userId;

    const filters = {
      userId,
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
      type: req.query.type as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await notificationService.getNotifications(filters);

    res.json({
      success: true,
      data: result.notifications,
      pagination: {
        total: result.total,
        hasMore: result.hasMore,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get notifications',
    });
  }
}

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
export async function getNotificationById(req: Request, res: Response) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await notificationService.getNotificationById(id, userId);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Get notification error:', error);
    if (error instanceof Error && error.message === 'Notification not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found',
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get notification',
    });
  }
}

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await notificationService.markAsRead({
      notificationId: id,
      userId,
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    if (error instanceof Error && error.message === 'Notification not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found',
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to mark as read',
    });
  }
}

/**
 * Mark notification as unread
 * PATCH /api/notifications/:id/unread
 */
export async function markAsUnread(req: Request, res: Response) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await notificationService.markAsUnread({
      notificationId: id,
      userId,
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Mark as unread error:', error);
    if (error instanceof Error && error.message === 'Notification not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found',
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to mark as unread',
    });
  }
}

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.userId;

    const result = await notificationService.markAllAsRead({ userId });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to mark all as read',
    });
  }
}

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(req: Request, res: Response) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.userId;
    const { id } = req.params;

    await notificationService.deleteNotification(id, userId);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    if (error instanceof Error && error.message === 'Notification not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found',
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to delete notification',
    });
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/unread/count
 */
export async function getUnreadCount(req: Request, res: Response) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.userId;

    const result = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get unread count',
    });
  }
}

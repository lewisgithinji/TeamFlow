import type { Request, Response, NextFunction } from 'express';
import * as notificationService from './notification.service';

/**
 * Get notifications for current user
 * GET /api/notifications
 */
export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.id;

    const filters = {
      userId,
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
      type: req.query.type as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await notificationService.getNotifications(filters);

    res.status(200).json({
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
    next(error);
  }
}

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
export async function getNotificationById(req: Request, res: Response, next: NextFunction) {
  try {
    // This feature is not yet fully implemented.
    // @ts-ignore
    const userId = req.user.id;
    const notification = await notificationService.getNotificationById(req.params.id, userId);
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark notification as unread
 * PATCH /api/notifications/:id/unread
 */
export async function markAsUnread(req: Request, res: Response, next: NextFunction) {
  try {
    // This feature is not yet fully implemented. This service function does not exist yet.
    // @ts-ignore - user added by auth middleware
    const userId = req.user.id;
    const { id } = req.params;

    // const notification = await notificationService.markAsUnread(id, userId);

    res.json({
      success: true,
      data: null,
      message: 'Mark as unread is not yet implemented.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.id;
    const { id } = req.params;

    await notificationService.deleteNotification(id, userId);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/unread/count
 */
export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.id;
    const result = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete all notifications for the current user
 * DELETE /api/notifications
 */
export async function deleteAllNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.id;
    const result = await notificationService.deleteAllNotifications(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Get notification settings for the current user
 * GET /api/notifications/settings
 */
export async function getNotificationSettings(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.id;
    const settings = await notificationService.getNotificationSettings(userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

/**
 * Update notification settings for the current user
 * PATCH /api/notifications/settings
 */
export async function updateNotificationSettings(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user.id;
    const settings = await notificationService.updateNotificationSettings(userId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

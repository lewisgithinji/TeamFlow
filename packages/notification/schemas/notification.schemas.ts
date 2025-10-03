import { z } from 'zod';

/**
 * Create notification schema
 */
export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    'TASK_ASSIGNED',
    'TASK_DUE_SOON',
    'MENTION',
    'COMMENT',
    'WORKSPACE_INVITE',
    'TASK_COMPLETED',
    'MEMBER_JOINED',
    'MEMBER_LEFT',
  ]),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  linkUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * List notifications query schema
 */
export const listNotificationsSchema = z.object({
  isRead: z.enum(['true', 'false']).optional(),
  type: z
    .enum([
      'TASK_ASSIGNED',
      'TASK_DUE_SOON',
      'MENTION',
      'COMMENT',
      'WORKSPACE_INVITE',
      'TASK_COMPLETED',
      'MEMBER_JOINED',
      'MEMBER_LEFT',
    ])
    .optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * Mark as read schema
 */
export const markAsReadSchema = z.object({
  notificationId: z.string().uuid(),
});

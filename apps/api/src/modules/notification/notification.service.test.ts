import { prisma } from '@teamflow/database';
import { emitNotificationCreated } from '../../websocket';
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from './notification.service';
import { NotFoundError } from '../../utils/errors';

// Mock dependencies
jest.mock('@teamflow/database', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../websocket', () => ({
  emitNotificationCreated: jest.fn(),
}));

// Cast mocks to Jest's mock function type for type safety
const mockedPrismaNotificationCreate = prisma.notification.create as jest.Mock;
const mockedPrismaNotificationFindMany = prisma.notification.findMany as jest.Mock;
const mockedPrismaNotificationCount = prisma.notification.count as jest.Mock;
const mockedPrismaNotificationFindFirst = prisma.notification.findFirst as jest.Mock;
const mockedPrismaNotificationUpdate = prisma.notification.update as jest.Mock;
const mockedPrismaNotificationUpdateMany = prisma.notification.updateMany as jest.Mock;
const mockedPrismaNotificationDeleteMany = prisma.notification.deleteMany as jest.Mock;
const mockedPrismaTransaction = prisma.$transaction as jest.Mock;
const mockedEmitNotificationCreated = emitNotificationCreated as jest.Mock;

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification and emit a WebSocket event', async () => {
      const input = {
        userId: 'user-1',
        type: 'MENTION' as const,
        title: 'You were mentioned',
        message: 'Someone mentioned you in a comment.',
      };
      const createdNotification = { id: 'notif-1', ...input };
      mockedPrismaNotificationCreate.mockResolvedValue(createdNotification);

      const result = await createNotification(input);

      expect(mockedPrismaNotificationCreate).toHaveBeenCalledWith({ data: expect.any(Object) });
      expect(mockedEmitNotificationCreated).toHaveBeenCalledWith(createdNotification);
      expect(result).toEqual(createdNotification);
    });
  });

  describe('getNotifications', () => {
    it('should fetch notifications and total count in a transaction', async () => {
      const notifications = [{ id: 'notif-1' }];
      const total = 1;
      mockedPrismaTransaction.mockResolvedValue([notifications, total]);

      const result = await getNotifications({ userId: 'user-1', limit: 10, offset: 0 });

      expect(mockedPrismaTransaction).toHaveBeenCalledTimes(1);
      expect(result.notifications).toEqual(notifications);
      expect(result.total).toBe(total);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', isRead: false };
      mockedPrismaNotificationFindFirst.mockResolvedValue(notification);
      mockedPrismaNotificationUpdate.mockResolvedValue({ ...notification, isRead: true });

      await markAsRead('notif-1', 'user-1');

      expect(mockedPrismaNotificationFindFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
      expect(mockedPrismaNotificationUpdate).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundError if notification does not exist', async () => {
      mockedPrismaNotificationFindFirst.mockResolvedValue(null);

      await expect(markAsRead('notif-1', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should not update if notification is already read', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', isRead: true };
      mockedPrismaNotificationFindFirst.mockResolvedValue(notification);

      await markAsRead('notif-1', 'user-1');

      expect(mockedPrismaNotificationUpdate).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications for a user as read', async () => {
      mockedPrismaNotificationUpdateMany.mockResolvedValue({ count: 5 });

      const result = await markAllAsRead('user-1');

      expect(mockedPrismaNotificationUpdateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
      expect(result.count).toBe(5);
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      mockedPrismaNotificationCount.mockResolvedValue(3);

      const result = await getUnreadCount('user-1');

      expect(mockedPrismaNotificationCount).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
      expect(result.count).toBe(3);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification if the user owns it', async () => {
      // deleteMany returns a count of deleted records
      mockedPrismaNotificationDeleteMany.mockResolvedValue({ count: 1 });

      await deleteNotification('notif-1', 'user-1');

      expect(mockedPrismaNotificationDeleteMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
    });

    it('should throw NotFoundError if no notification was deleted', async () => {
      // This means the notification didn't exist or didn't belong to the user
      mockedPrismaNotificationDeleteMany.mockResolvedValue({ count: 0 });

      await expect(deleteNotification('notif-1', 'user-1')).rejects.toThrow(NotFoundError);
    });
  });
});

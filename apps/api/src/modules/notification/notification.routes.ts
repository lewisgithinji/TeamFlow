import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as notificationController from './notification.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread/count', notificationController.getUnreadCount);

router.get('/settings', notificationController.getNotificationSettings);
router.patch('/settings', notificationController.updateNotificationSettings);

router.delete('/', notificationController.deleteAllNotificationsHandler);

router.get('/:id', notificationController.getNotificationById);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/:id/unread', notificationController.markAsUnread);
router.delete('/:id', notificationController.deleteNotification);

router.post('/mark-all-read', notificationController.markAllAsRead);

export default router;

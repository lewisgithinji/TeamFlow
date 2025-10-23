import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as attachmentController from './attachment.controller';
import {
  requestUploadUrlSchema,
  finalizeUploadSchema,
} from './attachment.types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task attachment routes
router.post(
  '/tasks/:taskId/attachments/upload-url',
  validate(requestUploadUrlSchema),
  attachmentController.requestUploadUrl
);

router.post(
  '/tasks/:taskId/attachments',
  validate(finalizeUploadSchema),
  attachmentController.finalizeAttachment
);

router.get('/tasks/:taskId/attachments', attachmentController.listAttachments);

// Attachment-specific routes
router.get('/attachments/:id/download', attachmentController.getDownloadUrl);

router.get('/attachments/:id/view', attachmentController.getViewUrl);

router.delete('/attachments/:id', attachmentController.deleteAttachment);

export default router;

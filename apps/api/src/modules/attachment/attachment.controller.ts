import { Request, Response, NextFunction } from 'express';
import * as attachmentService from './attachment.service';
import { logger } from '../../utils/logger';

/**
 * Request presigned upload URL
 * POST /api/tasks/:taskId/attachments/upload-url
 */
export async function requestUploadUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { taskId } = req.params;
    const { filename, mimeType, size } = req.body;

    const result = await attachmentService.requestUploadUrl(userId, taskId, {
      filename,
      mimeType,
      size,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Finalize attachment after successful upload
 * POST /api/tasks/:taskId/attachments
 */
export async function finalizeAttachment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { taskId } = req.params;

    const attachment = await attachmentService.finalizeAttachment(
      userId,
      taskId,
      req.body
    );

    res.status(201).json({
      message: 'Attachment created successfully',
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List attachments for a task
 * GET /api/tasks/:taskId/attachments
 */
export async function listAttachments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { taskId } = req.params;

    const result = await attachmentService.listAttachments(userId, taskId);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get download URL for attachment
 * GET /api/attachments/:id/download
 */
export async function getDownloadUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await attachmentService.getDownloadUrl(userId, id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get view URL for attachment (inline display)
 * GET /api/attachments/:id/view
 */
export async function getViewUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await attachmentService.getViewUrl(userId, id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete attachment
 * DELETE /api/attachments/:id
 */
export async function deleteAttachment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await attachmentService.deleteAttachment(userId, id);

    res.status(200).json({
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

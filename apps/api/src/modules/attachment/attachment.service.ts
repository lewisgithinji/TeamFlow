import { prisma } from '@teamflow/database';
import { storageService } from '../../services/storage.service';
import { logger } from '../../utils/logger';
import { ATTACHMENT_CONSTRAINTS, isAllowedMimeType } from './attachment.constants';
import {
  CreateAttachmentInput,
  AttachmentResponse,
  AttachmentListResponse,
  DownloadUrlResponse,
  RequestUploadUrlInput,
  FinalizeUploadInput,
  UploadUrlResponse,
} from './attachment.types';
import { AppError } from '../../utils/errors';
import { emitAttachmentAdded, emitAttachmentDeleted } from '../../websocket/socket.events';

/**
 * Request presigned upload URL
 */
export async function requestUploadUrl(
  userId: string,
  taskId: string,
  input: RequestUploadUrlInput
): Promise<UploadUrlResponse> {
  // 1. Verify user has access to task
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: { userId },
          },
        },
      },
    },
    include: {
      project: {
        select: {
          workspaceId: true,
        },
      },
    },
  });

  if (!task) {
    throw new AppError(404, 'Task not found or access denied');
  }

  // 2. Validate file type
  if (!isAllowedMimeType(input.mimeType)) {
    throw new AppError(
      400,
      `File type ${input.mimeType} is not allowed`,
      {
        allowedTypes: ATTACHMENT_CONSTRAINTS.ALLOWED_MIME_TYPES,
      }
    );
  }

  // 3. Validate file size
  if (input.size > ATTACHMENT_CONSTRAINTS.MAX_FILE_SIZE) {
    throw new AppError(
      413,
      `File size exceeds maximum allowed (${ATTACHMENT_CONSTRAINTS.MAX_FILE_SIZE} bytes)`,
      {
        maxSize: ATTACHMENT_CONSTRAINTS.MAX_FILE_SIZE,
        providedSize: input.size,
      }
    );
  }

  // 4. Check task quota
  await checkTaskQuota(taskId, input.size);

  // 5. Generate presigned upload URL
  const { uploadUrl, storageKey } = await storageService.generateUploadUrl(
    taskId,
    input.filename,
    input.mimeType,
    ATTACHMENT_CONSTRAINTS.UPLOAD_URL_EXPIRY
  );

  logger.info('Generated upload URL', {
    userId,
    taskId,
    filename: input.filename,
    size: input.size,
    storageKey,
  });

  return {
    uploadUrl,
    storageKey,
    expiresIn: ATTACHMENT_CONSTRAINTS.UPLOAD_URL_EXPIRY,
    maxSize: ATTACHMENT_CONSTRAINTS.MAX_FILE_SIZE,
  };
}

/**
 * Finalize attachment after successful upload
 */
export async function finalizeAttachment(
  userId: string,
  taskId: string,
  input: FinalizeUploadInput
): Promise<AttachmentResponse> {
  // 1. Verify user has access to task
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: { userId },
          },
        },
      },
    },
    include: {
      project: {
        select: {
          id: true,
          workspaceId: true,
        },
      },
    },
  });

  if (!task) {
    throw new AppError(404, 'Task not found or access denied');
  }

  // 2. Verify file exists in storage
  const fileExists = await storageService.fileExists(input.storageKey);
  if (!fileExists) {
    throw new AppError(404, 'File not found in storage');
  }

  // 3. Create attachment record
  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      filename: input.filename,
      originalName: input.originalName,
      url: input.storageKey, // For backward compatibility
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      size: input.size,
      status: 'AVAILABLE',
      uploadedBy: userId,
      metadata: input.metadata || {},
      checksum: input.checksum,
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  // 4. Create activity log
  await prisma.activity.create({
    data: {
      entityType: 'ATTACHMENT',
      entityId: attachment.id,
      action: 'ATTACHMENT_ADDED',
      userId,
      workspaceId: task.project.workspaceId,
      metadata: {
        taskId,
        filename: input.filename,
        size: input.size,
      },
    },
  });

  // 5. Generate signed URL for response
  const signedUrl = await storageService.generateViewUrl(
    attachment.storageKey,
    ATTACHMENT_CONSTRAINTS.SIGNED_URL_EXPIRY
  );

  logger.info('Attachment finalized', {
    attachmentId: attachment.id,
    taskId,
    filename: input.filename,
    userId,
  });

  const response: AttachmentResponse = {
    id: attachment.id,
    taskId: attachment.taskId,
    filename: attachment.filename,
    originalName: attachment.originalName,
    url: signedUrl,
    mimeType: attachment.mimeType,
    size: attachment.size,
    status: attachment.status,
    thumbnailUrl: attachment.thumbnailUrl || undefined,
    metadata: (attachment.metadata as any) || undefined,
    uploadedBy: attachment.uploader,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
  };

  // 6. Emit WebSocket event
  emitAttachmentAdded({
    attachmentId: attachment.id,
    taskId,
    projectId: task.project.id,
    attachment: response,
    uploadedBy: {
      userId,
      name: attachment.uploader?.name || 'Unknown',
    },
  });

  return response;
}

/**
 * List attachments for a task
 */
export async function listAttachments(
  userId: string,
  taskId: string
): Promise<AttachmentListResponse> {
  // 1. Verify user has access to task
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: { userId },
          },
        },
      },
    },
  });

  if (!task) {
    throw new AppError(404, 'Task not found or access denied');
  }

  // 2. Fetch attachments
  const attachments = await prisma.attachment.findMany({
    where: {
      taskId,
      status: 'AVAILABLE',
      deletedAt: null,
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 3. Generate signed URLs for each attachment
  const attachmentsWithUrls = await Promise.all(
    attachments.map(async (attachment) => {
      const signedUrl = await storageService.generateViewUrl(
        attachment.storageKey,
        ATTACHMENT_CONSTRAINTS.SIGNED_URL_EXPIRY
      );

      return {
        id: attachment.id,
        taskId: attachment.taskId,
        filename: attachment.filename,
        originalName: attachment.originalName,
        url: signedUrl,
        mimeType: attachment.mimeType,
        size: attachment.size,
        status: attachment.status,
        thumbnailUrl: attachment.thumbnailUrl || undefined,
        metadata: (attachment.metadata as any) || undefined,
        uploadedBy: attachment.uploader,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      };
    })
  );

  // 4. Calculate total size
  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);

  logger.debug('Listed attachments', {
    taskId,
    count: attachments.length,
    totalSize,
  });

  return {
    attachments: attachmentsWithUrls,
    totalSize,
    count: attachments.length,
  };
}

/**
 * Get download URL for attachment
 */
export async function getDownloadUrl(
  userId: string,
  attachmentId: string
): Promise<DownloadUrlResponse> {
  // 1. Fetch attachment with access check
  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      task: {
        project: {
          workspace: {
            members: {
              some: { userId },
            },
          },
        },
      },
    },
  });

  if (!attachment) {
    throw new AppError(404, 'Attachment not found or access denied');
  }

  if (attachment.status !== 'AVAILABLE') {
    throw new AppError(400, 'Attachment is not available for download');
  }

  // 2. Generate download URL
  const downloadUrl = await storageService.generateDownloadUrl(
    attachment.storageKey,
    attachment.filename,
    ATTACHMENT_CONSTRAINTS.SIGNED_URL_EXPIRY
  );

  logger.debug('Generated download URL', {
    attachmentId,
    filename: attachment.filename,
    userId,
  });

  return {
    downloadUrl,
    filename: attachment.filename,
    expiresIn: ATTACHMENT_CONSTRAINTS.SIGNED_URL_EXPIRY,
  };
}

/**
 * Get view URL for attachment (inline display)
 */
export async function getViewUrl(
  userId: string,
  attachmentId: string
): Promise<DownloadUrlResponse> {
  // 1. Fetch attachment with access check
  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      task: {
        project: {
          workspace: {
            members: {
              some: { userId },
            },
          },
        },
      },
    },
  });

  if (!attachment) {
    throw new AppError(404, 'Attachment not found or access denied');
  }

  if (attachment.status !== 'AVAILABLE') {
    throw new AppError(400, 'Attachment is not available');
  }

  // 2. Generate view URL
  const viewUrl = await storageService.generateViewUrl(
    attachment.storageKey,
    ATTACHMENT_CONSTRAINTS.SIGNED_URL_EXPIRY
  );

  logger.debug('Generated view URL', {
    attachmentId,
    filename: attachment.filename,
    userId,
  });

  return {
    downloadUrl: viewUrl,
    filename: attachment.filename,
    expiresIn: ATTACHMENT_CONSTRAINTS.SIGNED_URL_EXPIRY,
  };
}

/**
 * Delete attachment
 */
export async function deleteAttachment(
  userId: string,
  attachmentId: string
): Promise<void> {
  // 1. Fetch attachment with permission check
  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      OR: [
        { uploadedBy: userId }, // Uploader can delete
        { task: { createdBy: userId } }, // Task creator can delete
        {
          task: {
            project: {
              workspace: {
                members: {
                  some: {
                    userId,
                    role: { in: ['OWNER', 'ADMIN'] },
                  },
                },
              },
            },
          },
        }, // Workspace admin/owner can delete
      ],
    },
    include: {
      task: {
        include: {
          project: {
            select: {
              id: true,
              workspaceId: true,
            },
          },
        },
      },
    },
  });

  if (!attachment) {
    throw new AppError(404, 'Attachment not found or insufficient permissions');
  }

  // 2. Soft delete attachment
  await prisma.attachment.update({
    where: { id: attachmentId },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
      status: 'DELETED',
    },
  });

  // 3. Create activity log
  await prisma.activity.create({
    data: {
      entityType: 'ATTACHMENT',
      entityId: attachmentId,
      action: 'ATTACHMENT_DELETED',
      userId,
      workspaceId: attachment.task.project.workspaceId,
      metadata: {
        taskId: attachment.taskId,
        filename: attachment.filename,
      },
    },
  });

  // 4. Delete from storage (background job would be better)
  try {
    await storageService.deleteFile(attachment.storageKey);
  } catch (error) {
    logger.error('Failed to delete file from storage', {
      error: error instanceof Error ? error.message : 'Unknown error',
      attachmentId,
      storageKey: attachment.storageKey,
    });
    // Don't throw error, file will be cleaned up by background job
  }

  logger.info('Attachment deleted', {
    attachmentId,
    taskId: attachment.taskId,
    filename: attachment.filename,
    userId,
  });

  // 5. Emit WebSocket event
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  emitAttachmentDeleted({
    attachmentId,
    taskId: attachment.taskId,
    projectId: attachment.task.project.id,
    deletedBy: {
      userId,
      name: user?.name || 'Unknown',
    },
  });
}

/**
 * Check if task has exceeded storage quota
 */
async function checkTaskQuota(taskId: string, newFileSize: number): Promise<void> {
  const result = await prisma.attachment.aggregate({
    where: {
      taskId,
      status: 'AVAILABLE',
      deletedAt: null,
    },
    _sum: {
      size: true,
    },
  });

  const currentSize = result._sum.size || 0;
  const maxSize = ATTACHMENT_CONSTRAINTS.MAX_TASK_STORAGE;

  if (currentSize + newFileSize > maxSize) {
    const currentMB = (currentSize / 1024 / 1024).toFixed(2);
    const maxMB = (maxSize / 1024 / 1024).toFixed(2);
    throw new AppError(
      413,
      `Task storage limit exceeded (${currentMB}MB / ${maxMB}MB)`,
      {
        currentSize,
        maxSize,
        newFileSize,
      }
    );
  }
}

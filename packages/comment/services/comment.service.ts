import { prisma } from '@teamflow/database';
import {
  CommentData,
  CreateCommentInput,
  UpdateCommentInput,
  DeleteCommentInput,
  ListCommentsFilters,
  CommentWithReplies,
} from '../types';
import { extractMentions } from '../utils/mentions';

// Import WebSocket emitters
let emitCommentCreated: any;
let emitCommentUpdated: any;
let emitCommentDeleted: any;

// Dynamically import WebSocket emitters (only available in API server context)
try {
  const socketEvents = require('../../../apps/api/src/websocket/socket.events');
  emitCommentCreated = socketEvents.emitCommentCreated;
  emitCommentUpdated = socketEvents.emitCommentUpdated;
  emitCommentDeleted = socketEvents.emitCommentDeleted;
} catch (error) {
  // WebSocket emitters not available (e.g., in web app context)
  console.log('WebSocket emitters not available in this context');
}

export class CommentService {
  /**
   * Create a new comment
   */
  async createComment(input: CreateCommentInput): Promise<CommentData> {
    const { taskId, userId, content, parentId } = input;

    // Verify task exists and get project info
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify parent comment exists if provided
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      if (parentComment.taskId !== taskId) {
        throw new Error('Parent comment belongs to a different task');
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content,
        parentId,
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

    // Extract mentions and create notifications
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      await this.createMentionNotifications(comment.id, taskId, userId, mentions);
    }

    // Log activity - using taskId as entityId since Activity model only supports Task relation
    await prisma.activity.create({
      data: {
        entityType: 'COMMENT',
        entityId: taskId, // Using taskId instead of comment.id due to schema constraint
        action: 'CREATED',
        userId,
        workspaceId: task.project.workspaceId,
        metadata: {
          taskId,
          commentId: comment.id,
          parentId,
        },
      },
    });

    return comment;
  }

  /**
   * Get a comment by ID
   */
  async getComment(commentId: string): Promise<CommentData | null> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
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

    return comment;
  }

  /**
   * List comments for a task
   */
  async listComments(filters: ListCommentsFilters): Promise<CommentWithReplies[]> {
    const { taskId, includeDeleted = false, parentId } = filters;

    const comments = await prisma.comment.findMany({
      where: {
        taskId,
        parentId: parentId === null ? null : parentId,
        ...(includeDeleted ? {} : { deletedAt: null }),
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
        replies: {
          where: includeDeleted ? {} : { deletedAt: null },
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments.map((comment) => ({
      ...comment,
      replyCount: comment.replies?.length || 0,
    }));
  }

  /**
   * Update a comment
   */
  async updateComment(input: UpdateCommentInput): Promise<CommentData> {
    const { commentId, userId, content } = input;

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.userId !== userId) {
      throw new Error('You can only edit your own comments');
    }

    if (existingComment.deletedAt) {
      throw new Error('Cannot edit deleted comment');
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
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

    // Extract new mentions and create notifications
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      await this.createMentionNotifications(
        commentId,
        existingComment.taskId,
        userId,
        mentions
      );
    }

    // Log activity - using taskId as entityId since Activity model only supports Task relation
    await prisma.activity.create({
      data: {
        entityType: 'COMMENT',
        entityId: existingComment.taskId, // Using taskId instead of commentId due to schema constraint
        action: 'UPDATED',
        userId,
        workspaceId: existingComment.task.project.workspaceId,
        metadata: {
          taskId: existingComment.taskId,
          commentId,
        },
      },
    });

    return updatedComment;
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(input: DeleteCommentInput): Promise<void> {
    const { commentId, userId } = input;

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.userId !== userId) {
      throw new Error('You can only delete your own comments');
    }

    if (existingComment.deletedAt) {
      throw new Error('Comment already deleted');
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
        content: '[deleted]',
      },
    });

    // Log activity - using taskId as entityId since Activity model only supports Task relation
    await prisma.activity.create({
      data: {
        entityType: 'COMMENT',
        entityId: existingComment.taskId, // Using taskId instead of commentId due to schema constraint
        action: 'DELETED',
        userId,
        workspaceId: existingComment.task.project.workspaceId,
        metadata: {
          taskId: existingComment.taskId,
          commentId,
        },
      },
    });
  }

  /**
   * Create notifications for mentioned users
   */
  private async createMentionNotifications(
    commentId: string,
    taskId: string,
    mentionerUserId: string,
    mentionedUserIds: string[]
  ): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
      },
    });

    const mentioner = await prisma.user.findUnique({
      where: { id: mentionerUserId },
      select: {
        name: true,
      },
    });

    if (!task || !mentioner) return;

    // Create notifications for each mentioned user (except the mentioner)
    const notifications = mentionedUserIds
      .filter((userId) => userId !== mentionerUserId)
      .map((userId) => ({
        userId,
        type: 'MENTION' as const,
        title: 'You were mentioned',
        message: `${mentioner.name} mentioned you in a comment on "${task.title}"`,
        linkUrl: `/tasks/${taskId}#comment-${commentId}`,
        metadata: {
          taskId,
          commentId,
          mentionerId: mentionerUserId,
        },
      }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }
  }

  /**
   * Get comment count for a task
   */
  async getCommentCount(taskId: string): Promise<number> {
    return prisma.comment.count({
      where: {
        taskId,
        deletedAt: null,
      },
    });
  }
}

export const commentService = new CommentService();

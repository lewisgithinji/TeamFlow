import { z } from 'zod';

export const createCommentSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
  parentId: z.string().uuid('Invalid parent comment ID').optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
});

export const listCommentsSchema = z.object({
  includeDeleted: z.boolean().optional(),
  parentId: z.string().uuid().optional().nullable(),
});

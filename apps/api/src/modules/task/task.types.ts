import { z } from 'zod';

const TaskStatus = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'ARCHIVED']);

const TaskPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().uuid('Invalid project ID'),
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    description: z.string().optional(),
    status: TaskStatus.optional(),
    priority: TaskPriority.optional(),
    dueDate: z.string().datetime().optional(),
    storyPoints: z.number().int().min(0).optional(),
    assigneeIds: z.array(z.string().uuid()).optional(),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional().nullable(),
    status: TaskStatus.optional(),
    priority: TaskPriority.optional(),
    dueDate: z.string().datetime().optional().nullable(),
    storyPoints: z.number().int().min(0).optional().nullable(),
    assigneeIds: z.array(z.string().uuid()).optional(),
  }),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];

export const updateTaskPositionSchema = z.object({
  body: z.object({
    status: TaskStatus,
    position: z.number().int().min(0, 'Position must be a non-negative number'),
  }),
});

export type UpdateTaskPositionInput = z.infer<typeof updateTaskPositionSchema>['body'];

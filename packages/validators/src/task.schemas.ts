import { z } from 'zod';
import { TaskStatus, TaskPriority } from './enums';

// Fibonacci story points
const storyPointsSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(5),
  z.literal(8),
  z.literal(13),
  z.literal(21),
  z.null(),
]);

// Create Task
export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(50000, 'Description too long').optional(),
  status: TaskStatus.default('TODO'),
  priority: TaskPriority.default('MEDIUM'),
  storyPoints: storyPointsSchema.optional(),
  dueDate: z.string().datetime().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// Update Task
export const updateTaskSchema = createTaskSchema.partial().extend({
  version: z.number().int().min(1), // Optimistic locking
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// Create Subtask
export const createSubtaskSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1).max(200),
  position: z.number().int().min(0).optional(),
});

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;

// Update Subtask
export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;

// Task Filters
export const taskFiltersSchema = z.object({
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  assigneeId: z.string().uuid().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  search: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
});

export type TaskFilters = z.infer<typeof taskFiltersSchema>;

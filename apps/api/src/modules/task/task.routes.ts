/**
 * Task Routes
 * Reference: Sprint 1 Planning - User Story 3.1
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as taskController from './task.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(500, 'Task title must not exceed 500 characters'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(500, 'Task title must not exceed 500 characters')
    .optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

const updateTaskPositionSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']),
  position: z.number().int().min(0),
});

// Routes

// Create task
router.post('/', validate(createTaskSchema), taskController.createTask);

// Get task details
router.get('/:id', taskController.getTaskById);

// Update task position (must come before /:id routes)
router.patch('/:id/position', validate(updateTaskPositionSchema), taskController.updateTaskPosition);

// Update task
router.patch('/:id', validate(updateTaskSchema), taskController.updateTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

export default router;

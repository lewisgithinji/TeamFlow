/**
 * Project Routes
 * Reference: Sprint 1 Planning - User Story 2.4
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as projectController from './project.controller';
import * as taskController from '../task/task.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createProjectSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must not exceed 100 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must not exceed 100 characters')
    .optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  archived: z.boolean().optional(),
});

// Routes

// Create project
router.post('/', validate(createProjectSchema), projectController.createProject);

// Get project details
router.get('/:id', projectController.getProjectById);

// Update project
router.patch('/:id', validate(updateProjectSchema), projectController.updateProject);

// Delete project
router.delete('/:id', projectController.deleteProject);

// List workspace projects (nested route)
// This will also be registered on workspaces router as /api/workspaces/:workspaceId/projects
router.get(
  '/workspace/:workspaceId',
  projectController.listWorkspaceProjects
);

// List project tasks (nested route)
// GET /api/projects/:projectId/tasks
router.get('/:projectId/tasks', taskController.listProjectTasks);

export default router;

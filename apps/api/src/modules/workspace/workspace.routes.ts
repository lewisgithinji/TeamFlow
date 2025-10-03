import { Router } from 'express';
import * as workspaceController from './workspace.controller';
import * as projectController from '../project/project.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createWorkspaceSchema, updateWorkspaceSchema } from '@teamflow/validators';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/workspaces
 * @desc    Create a new workspace
 * @access  Private
 * @reference Sprint 1 Planning - Task 2.1.2
 */
router.post('/', validate(createWorkspaceSchema), workspaceController.createWorkspace);

/**
 * @route   GET /api/workspaces
 * @desc    List all workspaces for current user
 * @access  Private
 * @reference Sprint 1 Planning - Task 2.1.3
 */
router.get('/', workspaceController.listUserWorkspaces);

/**
 * @route   GET /api/workspaces/:id
 * @desc    Get workspace details
 * @access  Private
 * @reference Sprint 1 Planning - Task 2.1.4
 */
router.get('/:id', workspaceController.getWorkspaceById);

/**
 * @route   PATCH /api/workspaces/:id
 * @desc    Update workspace
 * @access  Private (Owner/Admin only)
 */
router.patch('/:id', validate(updateWorkspaceSchema), workspaceController.updateWorkspace);

/**
 * @route   DELETE /api/workspaces/:id
 * @desc    Delete workspace
 * @access  Private (Owner only)
 */
router.delete('/:id', workspaceController.deleteWorkspace);

/**
 * @route   GET /api/workspaces/:workspaceId/projects
 * @desc    List all projects in a workspace
 * @access  Private
 * @reference Sprint 1 Planning - Task 2.4.3
 */
router.get('/:workspaceId/projects', projectController.listWorkspaceProjects);

export default router;

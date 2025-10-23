/**
 * Project Controller
 * Reference: Sprint 1 Planning - User Story 2.4
 * HTTP request handlers for project endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as projectService from './project.service';

/**
 * Create a new project
 * POST /api/projects
 */
export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { workspaceId, name, description, icon, visibility } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Workspace ID is required',
      });
    }

    const project = await projectService.createProject(userId, workspaceId, {
      name,
      description,
      icon,
      visibility,
    });

    res.status(201).json({
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List projects in a workspace
 * GET /api/workspaces/:workspaceId/projects
 */
export async function listWorkspaceProjects(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    const { workspaceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const projects = await projectService.listWorkspaceProjects(userId, workspaceId);

    res.status(200).json({
      data: projects,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get project details
 * GET /api/projects/:id
 */
export async function getProjectById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const project = await projectService.getProjectById(userId, id);

    res.status(200).json({
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update project
 * PATCH /api/projects/:id
 */
export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, description, icon, visibility, archived } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const project = await projectService.updateProject(userId, id, {
      name,
      description,
      icon,
      visibility,
      archived,
    });

    res.status(200).json({
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete/archive project
 * DELETE /api/projects/:id
 */
export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const result = await projectService.deleteProject(userId, id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

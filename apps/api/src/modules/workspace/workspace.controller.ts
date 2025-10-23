import type { Request, Response, NextFunction } from 'express';
import * as workspaceService from './workspace.service';
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from '@teamflow/validators';

/**
 * Create a new workspace
 * POST /api/workspaces
 * Reference: Sprint 1 Planning - Task 2.1.2
 */
export async function createWorkspace(
  req: Request<{}, {}, CreateWorkspaceInput>,
  res: Response,
  next: NextFunction
) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const workspace = await workspaceService.createWorkspace(userId, req.body);

    res.status(201).json({
      message: 'Workspace created successfully',
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List user workspaces
 * GET /api/workspaces
 * Reference: Sprint 1 Planning - Task 2.1.3
 */
export async function listUserWorkspaces(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const workspaces = await workspaceService.listUserWorkspaces(userId);

    res.status(200).json({
      data: workspaces,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get workspace details
 * GET /api/workspaces/:id
 * Reference: Sprint 1 Planning - Task 2.1.4
 */
export async function getWorkspaceById(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const workspace = await workspaceService.getWorkspaceById(id, userId);

    res.status(200).json({
      data: workspace,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('do not have access') || error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
    }
    next(error);
  }
}

/**
 * Update workspace
 * PATCH /api/workspaces/:id
 */
export async function updateWorkspace(
  req: Request<{ id: string }, {}, UpdateWorkspaceInput>,
  res: Response,
  next: NextFunction
) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const workspace = await workspaceService.updateWorkspace(id, userId, req.body);

    res.status(200).json({
      message: 'Workspace updated successfully',
      data: workspace,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * Delete workspace
 * DELETE /api/workspaces/:id
 */
export async function deleteWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const result = await workspaceService.deleteWorkspace(id, userId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('owner')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
    }
    next(error);
  }
}

/**
 * Get workspace members
 * GET /api/workspaces/:workspaceId/members
 */
export async function getWorkspaceMembers(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore - user added by auth middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const { workspaceId } = req.params;
    const members = await workspaceService.getWorkspaceMembers(workspaceId, userId);

    res.status(200).json({
      data: members,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('do not have access')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    }
    next(error);
  }
}

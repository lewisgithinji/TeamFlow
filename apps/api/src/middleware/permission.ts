import { Request, Response, NextFunction } from 'express';
import { prisma, WorkspaceMember, WorkspaceRole, Task, Project } from '@teamflow/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { AppError } from '../utils/errors';

/**
 * Middleware to ensure the authenticated user is a member of the workspace
 * relevant to the request. It derives the workspace ID from either a taskId or
 * a projectId in the request parameters.
 */
export async function isWorkspaceMember(req: Request, res: Response, next: NextFunction) {
  // Extend Express Request type to include user and membership
  interface RequestWithAuthContext extends Request {
    user?: { id: string };
    membership?: WorkspaceMember;
    // Attach the resource itself for subsequent middleware to use without re-querying.
    task?: Task & { project: Project };
    project?: Project;
  }
  const request = req as RequestWithAuthContext;

  try {
    const userId = req.user?.id;
    if (!userId) {
      // This should technically be caught by the `authenticate` middleware first
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    const { taskId, projectId } = req.params;
    let workspaceId: string | null = null;

    if (taskId) {
      // Fetch the task with project and creator info for subsequent middleware
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });
      if (task) {
        workspaceId = task.project.workspaceId;
        request.task = task; // Attach the full task object
      }
    } else if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (project) {
        workspaceId = project.workspaceId;
        request.project = project; // Attach the full project object
      }
    }

    // If we couldn't find a workspace, it likely means the task/project
    // doesn't exist. We'll let the controller handle the 404 error
    // to provide a more specific "Task not found" or "Project not found" message, so we just continue.
    if (!workspaceId) {
      return next();
    }

    // Enhance the request logger with user and workspace context
    req.logger = req.logger.child({
      userId,
      workspaceId,
    });

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      return next(new ForbiddenError('You are not a member of this workspace.'));
    }

    // Attach membership to the request for use in subsequent middleware
    request.membership = membership;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware factory to ensure the user has one of the specified roles.
 * This should be used AFTER `isWorkspaceMember` to ensure `req.membership` is available.
 *
 * @param allowedRoles An array of roles that are allowed to access the route.
 */
export function hasRole(allowedRoles: WorkspaceRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extend Express Request type to include membership
    interface RequestWithMembership extends Request {
      membership?: WorkspaceMember;
    }
    const request = req as RequestWithMembership;

    const membership = request.membership;

    if (!membership) {
      // This can happen if `isWorkspaceMember` failed to find a workspaceId from params.
      // It's better to throw a clear error here than to silently fail.
      return next(new NotFoundError('Associated workspace'));
    }

    if (!allowedRoles.includes(membership.role)) {
      return next(
        new ForbiddenError(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}.`
        )
      );
    }

    next();
  };
}

/**
 * Middleware factory to ensure the user is the creator of the task OR has a specified role.
 * This should be used AFTER `isWorkspaceMember`.
 *
 * @param allowedRoles An array of roles that are allowed if the user is not the creator.
 */
export function isTaskCreatorOrHasRole(allowedRoles: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    interface RequestWithAuthContext extends Request {
      user?: { id: string };
      membership?: WorkspaceMember;
      task?: Task;
    }
    const request = req as RequestWithAuthContext;

    const userId = request.user?.id;
    const { taskId } = request.params;
    const membership = request.membership;

    if (!userId || !taskId) {
      // This should not happen if routes are set up correctly
      return next(new AppError('User or Task ID is missing.', 400, 'BAD_REQUEST'));
    }

    // 1. Check if the user has a privileged role. If so, they are authorized.
    if (membership && allowedRoles.includes(membership.role)) {
      return next();
    }

    // 2. If not, check if the user is the creator of the task using the object
    //    attached by the `isWorkspaceMember` middleware. This avoids a second DB call.
    const task = request.task;

    if (task && task.createdBy === userId) {
      return next();
    }

    // 3. If neither condition is met, deny access.
    return next(
      new ForbiddenError('You must be the task creator or an Admin/Owner to perform this action.')
    );
  };
}

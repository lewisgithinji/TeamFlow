/**
 * Task Controller
 * Reference: Sprint 1 Planning - User Story 3.1
 * HTTP request handlers for task endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as taskService from './task.service';

/**
 * Create a new task
 * POST /api/tasks
 * Task 3.1.2
 */
export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const task = await taskService.createTask(userId, req.body);

    res.status(201).json({
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a task
 * PATCH /api/tasks/:id
 * Task 3.1.3
 */
export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const task = await taskService.updateTask(userId, id, req.body);

    res.status(200).json({
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List tasks in a project
 * GET /api/projects/:projectId/tasks
 * Task 3.1.4
 */
export async function listProjectTasks(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const tasks = await taskService.listProjectTasks(userId, projectId);

    res.status(200).json({
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get task details
 * GET /api/tasks/:id
 * Task 3.1.5
 */
export async function getTaskById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const task = await taskService.getTaskById(userId, id);

    res.status(200).json({
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a task
 * DELETE /api/tasks/:id
 * Task 3.1.6
 */
export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const result = await taskService.deleteTask(userId, id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Update task position (for drag-and-drop)
 * PATCH /api/tasks/:id/position
 * Task 3.2.1
 */
export async function updateTaskPosition(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const task = await taskService.updateTaskPosition(userId, id, req.body);

    res.status(200).json({
      message: 'Task position updated successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

import { Request, Response, NextFunction } from 'express';
import * as taskService from './task.service';
import { CreateTaskInput, UpdateTaskInput, UpdateTaskPositionInput } from '@teamflow/validators';
import { asyncHandler } from '../../utils/asyncHandler';
import { getTaskById as getTaskByIdFromRepo } from './task.repository';

export const getTasksByProjectIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const tasks = await taskService.getTasksByProjectId(projectId, req.user!);
  res.status(200).json({ data: tasks });
});

export const getTaskByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id: taskId } = req.params;
  const task = await getTaskByIdFromRepo(taskId);
  res.status(200).json(task);
});

export const createTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.createTask(req.body as CreateTaskInput, req.user!);
  res.status(201).json({ data: task });
});

export const updateTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id: taskId } = req.params;
  const task = await taskService.updateTask(taskId, req.body as UpdateTaskInput, req.user!);
  res.status(200).json({ data: task });
});

export const updateTaskPositionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id: taskId } = req.params;
  const result = await taskService.updateTaskPosition(
    taskId,
    req.body as UpdateTaskPositionInput,
    req.user!
  );
  res.status(200).json({ data: result });
});

export const deleteTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id: taskId } = req.params;
  const result = await taskService.deleteTask(taskId, req.user!);
  res.status(200).json(result);
});

// Export aliases for route compatibility
export const createTask = createTaskHandler;
export const getTaskById = getTaskByIdHandler;
export const updateTask = updateTaskHandler;
export const updateTaskPosition = updateTaskPositionHandler;
export const deleteTask = deleteTaskHandler;
export const listProjectTasks = getTasksByProjectIdHandler;

/**
 * Task Service
 * Reference: Sprint 1 Planning - User Story 3.1
 * Business logic for task management
 */

import { prisma } from '@teamflow/database';
import type { TaskStatus, TaskPriority } from '@teamflow/database';
import {
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskDeleted,
  emitTaskMoved
} from '../../websocket/socket.events';

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  storyPoints?: number;
  dueDate?: Date;
  assigneeIds?: string[];
  labelIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  storyPoints?: number;
  dueDate?: Date;
  assigneeIds?: string[];
  labelIds?: string[];
}

export interface UpdateTaskPositionInput {
  status: TaskStatus;
  position: number;
}

/**
 * Create a new task
 * Task 3.1.2: Create task API endpoint
 */
export async function createTask(userId: string, input: CreateTaskInput) {
  const { projectId, assigneeIds, labelIds, ...taskData } = input;

  // Verify user has access to the project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found or you do not have access');
  }

  // Get the highest position in the TODO column (or default status)
  const maxPosition = await prisma.task.findFirst({
    where: {
      projectId,
      status: taskData.status || 'TODO',
    },
    orderBy: {
      position: 'desc',
    },
    select: {
      position: true,
    },
  });

  const position = maxPosition ? maxPosition.position + 1 : 0;

  // Create task with assignees and labels
  const task = await prisma.task.create({
    data: {
      ...taskData,
      projectId,
      createdBy: userId,
      position,
      assignees: assigneeIds
        ? {
            create: assigneeIds.map((assigneeId) => ({
              userId: assigneeId,
            })),
          }
        : undefined,
      labels: labelIds
        ? {
            create: labelIds.map((labelId) => ({
              labelId,
            })),
          }
        : undefined,
    },
    include: {
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      labels: {
        include: {
          label: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  // Emit real-time event
  emitTaskCreated({
    taskId: task.id,
    projectId,
    task,
    createdBy: {
      userId,
      name: task.creator?.name || 'Unknown',
    },
  });

  return task;
}

/**
 * Update a task
 * Task 3.1.3: Update task API endpoint
 */
export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
) {
  const { assigneeIds, labelIds, ...taskData } = input;

  // Verify user has access to the task
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
  });

  if (!existingTask) {
    throw new Error('Task not found or you do not have access');
  }

  // Update task with optional assignee and label updates
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...taskData,
      version: {
        increment: 1, // For optimistic locking
      },
      assignees:
        assigneeIds !== undefined
          ? {
              deleteMany: {},
              create: assigneeIds.map((assigneeId) => ({
                userId: assigneeId,
              })),
            }
          : undefined,
      labels:
        labelIds !== undefined
          ? {
              deleteMany: {},
              create: labelIds.map((labelId) => ({
                labelId,
              })),
            }
          : undefined,
    },
    include: {
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      labels: {
        include: {
          label: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  // Get user info for the emitter
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Emit real-time event
  // If status changed, emit task:moved, otherwise emit task:updated
  const statusChanged = input.status && existingTask.status !== input.status;

  if (statusChanged) {
    emitTaskMoved({
      taskId: task.id,
      projectId: existingTask.projectId,
      updates: taskData,
      updatedBy: {
        userId,
        name: user?.name || 'Unknown',
      },
    });
  } else {
    emitTaskUpdated({
      taskId: task.id,
      projectId: existingTask.projectId,
      updates: taskData,
      updatedBy: {
        userId,
        name: user?.name || 'Unknown',
      },
    });
  }

  return task;
}

/**
 * List tasks in a project
 * Task 3.1.4: List tasks in project endpoint
 */
export async function listProjectTasks(userId: string, projectId: string) {
  // Verify user has access to the project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found or you do not have access');
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
    },
    include: {
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      labels: {
        include: {
          label: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: [
      {
        status: 'asc',
      },
      {
        position: 'asc',
      },
    ],
  });

  return tasks;
}

/**
 * Get task by ID
 * Task 3.1.5: Get task details endpoint
 */
export async function getTaskById(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    include: {
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      labels: {
        include: {
          label: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!task) {
    throw new Error('Task not found or you do not have access');
  }

  return task;
}

/**
 * Delete a task (soft delete)
 * Task 3.1.6: Delete task API endpoint
 */
export async function deleteTask(userId: string, taskId: string) {
  // Verify user has access to the task and is creator or workspace admin
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId,
              OR: [
                { role: 'OWNER' },
                { role: 'ADMIN' },
                // Allow creator to delete their own task
                {
                  user: {
                    createdTasks: {
                      some: {
                        id: taskId,
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new Error(
      'Task not found or you do not have permission to delete it'
    );
  }

  // Hard delete for now (can change to soft delete later)
  await prisma.task.delete({
    where: { id: taskId },
  });

  // Get user info for the emitter
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Emit real-time event
  emitTaskDeleted({
    taskId,
    projectId: task.projectId,
    deletedBy: {
      userId,
      name: user?.name || 'Unknown',
    },
  });

  return { message: 'Task deleted successfully' };
}

/**
 * Update task position (for drag-and-drop)
 * Task 3.2.1: Update task position endpoint
 */
export async function updateTaskPosition(
  userId: string,
  taskId: string,
  input: UpdateTaskPositionInput
) {
  // Verify user has access to the task
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
  });

  if (!existingTask) {
    throw new Error('Task not found or you do not have access');
  }

  // Update task status and position
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: input.status,
      position: input.position,
      version: {
        increment: 1,
      },
    },
    include: {
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      labels: {
        include: {
          label: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  // Get user info for the emitter
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Emit real-time event for task moved
  emitTaskMoved({
    taskId: task.id,
    projectId: existingTask.projectId,
    updates: {
      status: input.status,
      position: input.position,
    },
    updatedBy: {
      userId,
      name: user?.name || 'Unknown',
    },
  });

  return task;
}

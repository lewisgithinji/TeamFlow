import { Prisma, User } from '@prisma/client';
import { prisma } from '@teamflow/database';
import type { TaskEvent } from '@teamflow/types';
import { redis } from '../../redis';
import { emitTaskCreated, emitTaskUpdated, emitTaskDeleted } from '../../websocket/socket.events';
import { NotFoundError } from '../../utils/errors';
import { createNotification } from '../notification/notification.service';
import { CreateTaskInput, UpdateTaskInput, UpdateTaskPositionInput } from '@teamflow/validators';
import { getTaskById } from './task.repository';
import * as slackNotifications from '../slack/slack.notifications';
import { executeAutomations } from '../automation/automation.executor';

const taskWithDetails = {
  include: {
    assignees: {
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    },
    labels: {
      include: {
        label: {
          select: { id: true, name: true, color: true },
        },
      },
    },
    project: {
      select: {
        workspaceId: true,
      },
    },
  },
};

export async function getTasksByProjectId(projectId: string) {
  return prisma.task.findMany({
    where: { projectId },
    orderBy: { position: 'asc' },
    ...taskWithDetails,
  });
}

export async function createTask(data: CreateTaskInput, user: User) {
  const { assigneeIds, labelIds, ...taskData } = data;

  // Get the highest position for the new task
  const highestPosition = await prisma.task.aggregate({
    where: { projectId: taskData.projectId },
    _max: { position: true },
  });

  const newPosition = (highestPosition._max.position ?? -1) + 1;

  const createdTask = await prisma.task.create({
    data: {
      ...taskData,
      createdBy: user.id,
      position: newPosition,
      assignees: assigneeIds
        ? {
            create: assigneeIds.map((userId) => ({
              userId,
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
    ...taskWithDetails,
  });

  // Emit a real-time event for task creation
  const eventData: TaskEvent = {
    taskId: createdTask.id,
    projectId: createdTask.projectId,
    workspaceId: createdTask.project.workspaceId,
    task: createdTask, // Send the full task object on creation
    updatedBy: {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
    },
  };
  emitTaskCreated(eventData);

  // Execute automation rules for task creation
  executeAutomations('TASK_CREATED', {
    task: createdTask as any,
    workspaceId: createdTask.project.workspaceId,
    userId: user.id,
  }).catch((error) => {
    console.error('Failed to execute automations for task creation:', error);
  });

  // Notify newly assigned users
  if (assigneeIds && assigneeIds.length > 0) {
    for (const assigneeId of assigneeIds) {
      // Don't notify the user if they assign the task to themselves
      if (assigneeId === user.id) continue;

      await createNotification({
        userId: assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'You have been assigned a new task',
        message: `${user.name} assigned you to the task: "${createdTask.title}"`,
        linkUrl: `/tasks/${createdTask.id}`, // Example URL
        metadata: {
          taskId: createdTask.id,
          assignerId: user.id,
        },
      });
    }

    // Send Slack notifications to newly assigned users
    for (const assigneeId of assigneeIds) {
      if (assigneeId === user.id) continue;

      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (assignee) {
        await slackNotifications.notifyTaskAssignment({
          task: createdTask,
          assignee,
          assignedBy: user,
        }).catch((error) => {
          // Log error but don't block task creation if Slack notification fails
          console.error('Failed to send Slack notification for task assignment:', error);
        });
      }
    }
  }

  return createdTask;
}

export async function updateTask(taskId: string, data: UpdateTaskInput, user: User) {
  const { assigneeIds, labelIds, ...taskData } = data;

  // Fetch the current task to compare assignees for notifications
  const currentTask = await getTaskById(taskId);
  if (!currentTask) {
    throw new NotFoundError('Task');
  }

  const cacheKey = `task:${taskId}`;
  const statusChanged = data.status && data.status !== currentTask.status;

  // Logic to calculate which assignees to add and remove
  let assigneeUpdate = undefined;
  if (assigneeIds) {
    const currentAssigneeIds = new Set(currentTask.assignees.map((a) => a.user.id));
    const newAssigneeIds = new Set(assigneeIds);

    const assigneesToAdd = assigneeIds.filter((id) => !currentAssigneeIds.has(id));
    const assigneesToRemove = [...currentAssigneeIds].filter((id) => !newAssigneeIds.has(id));

    assigneeUpdate = {
      create: assigneesToAdd.map((userId) => ({ userId })),
      deleteMany: { userId: { in: assigneesToRemove } },
    };
  }

  // Logic to calculate which labels to add and remove
  let labelUpdate = undefined;
  if (labelIds !== undefined) {
    const currentLabelIds = new Set(currentTask.labels?.map((l: any) => l.label.id) || []);
    const newLabelIds = new Set(labelIds);

    const labelsToAdd = labelIds.filter((id) => !currentLabelIds.has(id));
    const labelsToRemove = [...currentLabelIds].filter((id) => !newLabelIds.has(id));

    labelUpdate = {
      create: labelsToAdd.map((labelId) => ({ labelId })),
      deleteMany: labelsToRemove.length > 0 ? labelsToRemove.map((labelId) => ({ labelId })) : undefined,
    };
  }

  let updatedTask;

  // If status changed, we need to handle position recalculation
  if (statusChanged) {
    const oldStatus = currentTask.status;
    const newStatus = data.status!;
    const projectId = currentTask.projectId;

    // Get the last position in the new status column
    const highestPositionInNewColumn = await prisma.task.aggregate({
      where: { projectId, status: newStatus },
      _max: { position: true },
    });

    const newPosition = (highestPositionInNewColumn._max.position ?? -1) + 1;

    // Use transaction to handle position updates
    updatedTask = await prisma.$transaction(async (tx) => {
      // 1. Remove the task from its old position by shifting subsequent tasks down
      await tx.task.updateMany({
        where: {
          projectId,
          status: oldStatus,
          position: { gt: currentTask.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // 2. Update the task with new data and position
      return tx.task.update({
        where: { id: taskId },
        data: {
          ...taskData,
          position: newPosition,
          version: { increment: 1 },
          assignees: assigneeUpdate,
          labels: labelUpdate,
        },
        ...taskWithDetails,
      });
    });
  } else {
    // No status change, just update the task normally
    updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...taskData,
        version: { increment: 1 }, // For optimistic locking
        assignees: assigneeUpdate,
        labels: labelUpdate,
      },
      ...taskWithDetails,
    });
  }

  // Invalidate cache by deleting the old entry.
  // The next `getTaskById` call will repopulate it.
  await redis.del(cacheKey);

  // Notify only the newly added assignees
  if (assigneeIds) {
    const oldAssigneeIds = new Set(currentTask.assignees.map((a) => a.user.id));
    const newAssignees = assigneeIds.filter((id) => !oldAssigneeIds.has(id));

    for (const assigneeId of newAssignees) {
      if (assigneeId === user.id) continue;

      await createNotification({
        userId: assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'You have been assigned to a task',
        message: `${user.name} assigned you to the task: "${updatedTask.title}"`,
        linkUrl: `/tasks/${updatedTask.id}`,
        metadata: {
          taskId: updatedTask.id,
          assignerId: user.id,
        },
      });
    }

    // Send Slack notifications to newly added assignees
    for (const assigneeId of newAssignees) {
      if (assigneeId === user.id) continue;

      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (assignee) {
        await slackNotifications.notifyTaskAssignment({
          task: updatedTask,
          assignee,
          assignedBy: user,
        }).catch((error) => {
          console.error('Failed to send Slack notification for task assignment:', error);
        });
      }
    }
  }

  // Send Slack notification for status changes
  if (statusChanged) {
    await slackNotifications.notifyStatusChange({
      task: updatedTask,
      oldStatus: currentTask.status,
      newStatus: updatedTask.status,
      changedBy: user,
    }).catch((error) => {
      console.error('Failed to send Slack notification for status change:', error);
    });
  }

  // Emit a real-time event to all clients in the project room
  const eventData: TaskEvent = {
    taskId: updatedTask.id,
    projectId: updatedTask.projectId,
    workspaceId: updatedTask.project.workspaceId,
    updates: {
      ...data,
      // Add title for more descriptive notifications
      title: updatedTask.title,
      // Include old and new status for status change notifications
      ...(statusChanged && {
        oldStatus: currentTask.status,
        newStatus: updatedTask.status,
        position: updatedTask.position,
      }),
    },
    updatedBy: {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
    },
  };
  emitTaskUpdated(eventData);

  // Execute automation rules based on what changed
  if (statusChanged) {
    executeAutomations('TASK_STATUS_CHANGED', {
      task: updatedTask as any,
      previousTask: currentTask as any,
      workspaceId: updatedTask.project.workspaceId,
      userId: user.id,
    }).catch((error) => {
      console.error('Failed to execute automations for status change:', error);
    });
  }

  if (data.priority && data.priority !== currentTask.priority) {
    executeAutomations('TASK_PRIORITY_CHANGED', {
      task: updatedTask as any,
      previousTask: currentTask as any,
      workspaceId: updatedTask.project.workspaceId,
      userId: user.id,
    }).catch((error) => {
      console.error('Failed to execute automations for priority change:', error);
    });
  }

  if (assigneeIds) {
    const oldAssigneeIds = new Set(currentTask.assignees.map((a) => a.user.id));
    const newAssigneeIds = new Set(assigneeIds);
    if (oldAssigneeIds.size !== newAssigneeIds.size ||
        ![...oldAssigneeIds].every(id => newAssigneeIds.has(id))) {
      executeAutomations('TASK_ASSIGNED', {
        task: updatedTask as any,
        previousTask: currentTask as any,
        workspaceId: updatedTask.project.workspaceId,
        userId: user.id,
      }).catch((error) => {
        console.error('Failed to execute automations for task assignment:', error);
      });
    }
  }

  if (data.dueDate && !currentTask.dueDate) {
    executeAutomations('TASK_DUE_DATE_SET', {
      task: updatedTask as any,
      previousTask: currentTask as any,
      workspaceId: updatedTask.project.workspaceId,
      userId: user.id,
    }).catch((error) => {
      console.error('Failed to execute automations for due date set:', error);
    });
  }

  return updatedTask;
}

export async function deleteTask(taskId: string, user: User) {
  // The permission middleware `isTaskCreatorOrHasRole` already ensures
  // that the user has the right to delete this task.
  // We fetch the task details first to get IDs for cache invalidation and events.
  const taskToDelete = await getTaskById(taskId);
  if (!taskToDelete) {
    throw new NotFoundError('Task');
  }

  await prisma.task.delete({ where: { id: taskId } });

  await redis.del(`task:${taskId}`);

  const eventData: TaskEvent = {
    taskId: taskToDelete.id,
    projectId: taskToDelete.projectId,
    workspaceId: taskToDelete.project.workspaceId,
    updatedBy: {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
    },
  };
  emitTaskDeleted(eventData);

  return { message: 'Task deleted successfully' };
}

export async function updateTaskPosition(
  taskId: string,
  data: UpdateTaskPositionInput,
  user: User
) {
  const { status: newStatus, position: newPosition } = data;

  const {
    status: oldStatus,
    position: oldPosition,
    projectId,
    title,
    project: { workspaceId },
  } = await getTaskById(taskId);

  await prisma.$transaction(async (tx) => {
    // 1. Remove the task from its old position by shifting subsequent tasks down.
    await tx.task.updateMany({
      where: {
        projectId,
        status: oldStatus,
        position: { gt: oldPosition },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    // 2. Make space for the task in its new position by shifting subsequent tasks up.
    await tx.task.updateMany({
      where: {
        projectId,
        status: newStatus,
        position: { gte: newPosition },
      },
      data: {
        position: { increment: 1 },
      },
    });

    // 3. Finally, update the task itself to its new status and position.
    await tx.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        position: newPosition,
        version: { increment: 1 },
      },
    });
  });

  // Invalidate the cache for the moved task
  await redis.del(`task:${taskId}`);

  // Emit a real-time event for the move.
  // Note: Your frontend might listen for 'task:updated' or a new 'task:moved' event.
  // Using 'task:updated' is often sufficient.
  emitTaskUpdated({
    taskId: taskId,
    projectId: projectId,
    workspaceId: workspaceId,
    updates: {
      status: newStatus,
      position: newPosition,
      title, // Include task title
      oldStatus, // Include old status for "moved from X to Y" messages
      newStatus, // Explicitly include new status
    },
    updatedBy: {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
    },
  });
  return { message: 'Task position updated successfully' };
}

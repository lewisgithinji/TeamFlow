/**
 * Slack Notification Engine
 * Handles sending Slack notifications for various TeamFlow events
 */

import { PrismaClient, User, Task } from '@teamflow/database';
import SlackService from '../../services/slack.service';
import {
  buildTaskAssignmentMessage,
  buildStatusChangeMessage,
  buildMentionMessage,
  buildDueDateReminderMessage,
  buildSprintEventMessage,
} from './slack.messages';
import type {
  TaskAssignmentEvent,
  StatusChangeEvent,
  MentionEvent,
  DueDateEvent,
  SprintEvent,
} from './slack.types';

const prisma = new PrismaClient();

/**
 * Check if user should receive notification based on preferences
 */
async function shouldNotifyUser(
  userId: string,
  integrationId: string,
  eventType: 'assignment' | 'mention' | 'statusChange' | 'comment' | 'dueDate'
): Promise<{
  shouldNotify: boolean;
  preferences?: any;
  slackUserId?: string;
}> {
  // Get user's Slack preferences
  const preferences = await prisma.slackUserPreference.findUnique({
    where: {
      userId_integrationId: {
        userId,
        integrationId,
      },
    },
  });

  // If no preferences, create default (all enabled)
  if (!preferences) {
    const defaultPrefs = await prisma.slackUserPreference.create({
      data: {
        userId,
        integrationId,
      },
    });
    return {
      shouldNotify: true,
      preferences: defaultPrefs,
    };
  }

  // Check if notifications are disabled
  if (preferences.frequency === 'disabled') {
    return { shouldNotify: false };
  }

  // Check if DMs are disabled
  if (!preferences.enableDMs) {
    return { shouldNotify: false };
  }

  // Check event-specific preferences
  const eventPreferenceMap = {
    assignment: preferences.notifyOnAssignment,
    mention: preferences.notifyOnMention,
    statusChange: preferences.notifyOnStatusChange,
    comment: preferences.notifyOnComment,
    dueDate: preferences.notifyOnDueDate,
  };

  if (!eventPreferenceMap[eventType]) {
    return { shouldNotify: false };
  }

  // Check quiet hours
  if (preferences.quietHoursEnabled && preferences.quietHoursStart && preferences.quietHoursEnd) {
    if (isWithinQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd)) {
      return { shouldNotify: false, preferences };
    }
  }

  // Check frequency (instant notifications only for now)
  // TODO: Implement hourly/daily digest queuing
  if (preferences.frequency !== 'instant') {
    // Queue for digest instead
    return { shouldNotify: false, preferences };
  }

  return {
    shouldNotify: true,
    preferences,
    slackUserId: preferences.slackUserId || undefined,
  };
}

/**
 * Check if current time is within quiet hours
 */
function isWithinQuietHours(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }

  return currentTime >= start && currentTime <= end;
}

/**
 * Find or map user's Slack ID
 */
async function findSlackUserId(
  workspaceId: string,
  user: { id: string; email: string },
  integrationId: string
): Promise<string | null> {
  // Check if already mapped
  const existingPref = await prisma.slackUserPreference.findUnique({
    where: {
      userId_integrationId: {
        userId: user.id,
        integrationId,
      },
    },
    select: { slackUserId: true },
  });

  if (existingPref?.slackUserId) {
    return existingPref.slackUserId;
  }

  // Try to find by email
  const slackUser = await SlackService.findUserByEmail(workspaceId, user.email);

  if (slackUser) {
    // Save mapping for future use
    await prisma.slackUserPreference.upsert({
      where: {
        userId_integrationId: {
          userId: user.id,
          integrationId,
        },
      },
      update: {
        slackUserId: slackUser.id,
        slackUserName: slackUser.name,
      },
      create: {
        userId: user.id,
        integrationId,
        slackUserId: slackUser.id,
        slackUserName: slackUser.name,
      },
    });

    return slackUser.id;
  }

  return null;
}

/**
 * Send task assignment notification to Slack
 */
export async function notifyTaskAssignment(data: {
  task: Task & { project: any };
  assignee: User;
  assignedBy: User;
}): Promise<void> {
  try {
    const { task, assignee, assignedBy } = data;

    // Get Slack integration for this workspace
    const integration = await prisma.slackIntegration.findUnique({
      where: { workspaceId: task.project.workspaceId, isActive: true },
    });

    if (!integration) {
      // No Slack integration for this workspace
      return;
    }

    // Check if user should be notified
    const { shouldNotify, slackUserId: existingSlackId } = await shouldNotifyUser(
      assignee.id,
      integration.id,
      'assignment'
    );

    if (!shouldNotify) {
      return;
    }

    // Find Slack user ID
    const slackUserId =
      existingSlackId ||
      (await findSlackUserId(task.project.workspaceId, assignee, integration.id));

    if (!slackUserId) {
      console.warn(`Could not find Slack user for ${assignee.email}`);
      return;
    }

    // Build message
    const event: TaskAssignmentEvent = {
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description || undefined,
      taskPriority: task.priority,
      taskStatus: task.status,
      taskDueDate: task.dueDate || undefined,
      projectId: task.projectId,
      projectName: task.project.name,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      assigneeEmail: assignee.email,
      assignedBy: assignedBy.id,
      assignedByName: assignedBy.name,
      workspaceId: task.project.workspaceId,
    };

    const message = buildTaskAssignmentMessage(event);

    // Send to Slack
    await SlackService.sendDirectMessage(task.project.workspaceId, slackUserId, message);

    console.log(`✅ Slack notification sent: Task assigned to ${assignee.name}`);
  } catch (error) {
    console.error('Failed to send Slack task assignment notification:', error);
    // Don't throw - notifications shouldn't break the main flow
  }
}

/**
 * Send status change notification to Slack
 */
export async function notifyStatusChange(data: {
  task: Task & { project: any; assignees: any[] };
  oldStatus: string;
  newStatus: string;
  changedBy: User;
}): Promise<void> {
  try {
    const { task, oldStatus, newStatus, changedBy } = data;

    // Get Slack integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { workspaceId: task.project.workspaceId, isActive: true },
    });

    if (!integration) {
      return;
    }

    // Build event
    const event: StatusChangeEvent = {
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description || undefined,
      projectId: task.projectId,
      projectName: task.project.name,
      oldStatus,
      newStatus,
      changedBy: changedBy.id,
      changedByName: changedBy.name,
      workspaceId: task.project.workspaceId,
    };

    const message = buildStatusChangeMessage(event);

    // Notify all assignees
    for (const assignee of task.assignees) {
      const user = assignee.user;

      // Skip the person who made the change
      if (user.id === changedBy.id) continue;

      const { shouldNotify, slackUserId: existingSlackId } = await shouldNotifyUser(
        user.id,
        integration.id,
        'statusChange'
      );

      if (!shouldNotify) continue;

      const slackUserId =
        existingSlackId || (await findSlackUserId(task.project.workspaceId, user, integration.id));

      if (slackUserId) {
        await SlackService.sendDirectMessage(task.project.workspaceId, slackUserId, message);
        console.log(`✅ Slack notification sent: Status change to ${user.name}`);
      }
    }

    // Also post to channel if mapped
    const channelMapping = await prisma.slackChannelMapping.findFirst({
      where: {
        integrationId: integration.id,
        projectId: task.projectId,
        notifyOnStatusChange: true,
      },
    });

    if (channelMapping) {
      await SlackService.sendChannelMessage(
        task.project.workspaceId,
        channelMapping.channelId,
        message
      );
      console.log(`✅ Slack notification sent to channel: ${channelMapping.channelName}`);
    }
  } catch (error) {
    console.error('Failed to send Slack status change notification:', error);
  }
}

/**
 * Send mention notification to Slack
 */
export async function notifyMention(data: {
  task: Task & { project: any };
  comment: { id: string; content: string };
  mentionedUser: User;
  mentionedBy: User;
}): Promise<void> {
  try {
    const { task, comment, mentionedUser, mentionedBy } = data;

    // Get Slack integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { workspaceId: task.project.workspaceId, isActive: true },
    });

    if (!integration) {
      return;
    }

    // Check if user should be notified
    const { shouldNotify, slackUserId: existingSlackId } = await shouldNotifyUser(
      mentionedUser.id,
      integration.id,
      'mention'
    );

    if (!shouldNotify) {
      return;
    }

    // Find Slack user ID
    const slackUserId =
      existingSlackId ||
      (await findSlackUserId(task.project.workspaceId, mentionedUser, integration.id));

    if (!slackUserId) {
      return;
    }

    // Build event
    const event: MentionEvent = {
      taskId: task.id,
      taskTitle: task.title,
      commentId: comment.id,
      commentContent: comment.content,
      projectId: task.projectId,
      projectName: task.project.name,
      mentionedUserId: mentionedUser.id,
      mentionedUserName: mentionedUser.name,
      mentionedUserEmail: mentionedUser.email,
      mentionedBy: mentionedBy.id,
      mentionedByName: mentionedBy.name,
      workspaceId: task.project.workspaceId,
    };

    const message = buildMentionMessage(event);

    // Send to Slack
    await SlackService.sendDirectMessage(task.project.workspaceId, slackUserId, message);

    console.log(`✅ Slack notification sent: Mention to ${mentionedUser.name}`);
  } catch (error) {
    console.error('Failed to send Slack mention notification:', error);
  }
}

/**
 * Send due date reminder to Slack
 */
export async function notifyDueDateReminder(data: {
  task: Task & { project: any; assignees: any[] };
  hoursUntilDue: number;
}): Promise<void> {
  try {
    const { task, hoursUntilDue } = data;

    if (!task.dueDate) {
      return;
    }

    // Get Slack integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { workspaceId: task.project.workspaceId, isActive: true },
    });

    if (!integration) {
      return;
    }

    // Build event
    const event: DueDateEvent = {
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description || undefined,
      taskPriority: task.priority,
      taskStatus: task.status,
      taskDueDate: task.dueDate,
      projectId: task.projectId,
      projectName: task.project.name,
      assigneeIds: task.assignees.map((a: any) => a.user.id),
      workspaceId: task.project.workspaceId,
      hoursUntilDue,
    };

    const message = buildDueDateReminderMessage(event);

    // Notify all assignees
    for (const assignee of task.assignees) {
      const user = assignee.user;

      const { shouldNotify, slackUserId: existingSlackId } = await shouldNotifyUser(
        user.id,
        integration.id,
        'dueDate'
      );

      if (!shouldNotify) continue;

      const slackUserId =
        existingSlackId || (await findSlackUserId(task.project.workspaceId, user, integration.id));

      if (slackUserId) {
        await SlackService.sendDirectMessage(task.project.workspaceId, slackUserId, message);
        console.log(`✅ Slack notification sent: Due date reminder to ${user.name}`);
      }
    }
  } catch (error) {
    console.error('Failed to send Slack due date reminder:', error);
  }
}

/**
 * Send sprint event notification to Slack
 */
export async function notifySprintEvent(data: {
  sprint: any;
  project: any;
  eventType: 'started' | 'completed' | 'cancelled';
}): Promise<void> {
  try {
    const { sprint, project, eventType } = data;

    // Get Slack integration
    const integration = await prisma.slackIntegration.findUnique({
      where: { workspaceId: project.workspaceId, isActive: true },
    });

    if (!integration) {
      return;
    }

    // Build event
    const event: SprintEvent = {
      sprintId: sprint.id,
      sprintName: sprint.name,
      sprintGoal: sprint.goal,
      sprintStartDate: sprint.startDate,
      sprintEndDate: sprint.endDate,
      projectId: project.id,
      projectName: project.name,
      workspaceId: project.workspaceId,
      eventType,
    };

    const message = buildSprintEventMessage(event);

    // Post to default channel or project-specific channel
    const channelMapping = await prisma.slackChannelMapping.findFirst({
      where: {
        integrationId: integration.id,
        OR: [{ projectId: project.id }, { projectId: null }],
      },
      orderBy: {
        // Prefer project-specific mappings
        projectId: 'desc',
      },
    });

    if (channelMapping) {
      await SlackService.sendChannelMessage(
        project.workspaceId,
        channelMapping.channelId,
        message
      );
      console.log(`✅ Slack notification sent: Sprint ${eventType} to ${channelMapping.channelName}`);
    } else if (integration.defaultChannelId) {
      await SlackService.sendChannelMessage(
        project.workspaceId,
        integration.defaultChannelId,
        message
      );
      console.log(`✅ Slack notification sent: Sprint ${eventType} to default channel`);
    }
  } catch (error) {
    console.error('Failed to send Slack sprint notification:', error);
  }
}

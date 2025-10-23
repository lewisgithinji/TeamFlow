/**
 * Slack Message Builders
 * Build rich Slack messages using Block Kit
 */

import type {
  SlackMessage,
  SlackBlock,
  TaskAssignmentEvent,
  StatusChangeEvent,
  MentionEvent,
  DueDateEvent,
  SprintEvent,
} from './slack.types';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

/**
 * Build task assignment notification message
 */
export function buildTaskAssignmentMessage(event: TaskAssignmentEvent): SlackMessage {
  const taskUrl = `${FRONTEND_URL}/tasks/${event.taskId}`;
  const priorityEmoji = getPriorityEmoji(event.taskPriority);
  const statusEmoji = getStatusEmoji(event.taskStatus);

  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*New Task Assigned* 🎯\n\n*${event.taskTitle}*${event.taskDescription ? `\n${truncateText(event.taskDescription, 150)}` : ''}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${priorityEmoji} Priority: *${event.taskPriority}*`,
        } as any,
        {
          type: 'mrkdwn',
          text: `${statusEmoji} Status: *${event.taskStatus}*`,
        } as any,
        {
          type: 'mrkdwn',
          text: `📁 Project: *${event.projectName}*`,
        } as any,
      ],
    },
  ];

  // Add due date if available
  if (event.taskDueDate) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📅 Due: *${formatDate(event.taskDueDate)}*`,
        } as any,
      ],
    });
  }

  // Add action buttons
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Task',
          emoji: true,
        },
        url: taskUrl,
        style: 'primary',
        action_id: 'view_task',
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Mark as Done',
          emoji: true,
        },
        value: event.taskId,
        action_id: 'mark_task_done',
      },
    ],
  });

  return {
    text: `You've been assigned to: ${event.taskTitle}`,
    blocks,
  };
}

/**
 * Build status change notification message
 */
export function buildStatusChangeMessage(event: StatusChangeEvent): SlackMessage {
  const taskUrl = `${FRONTEND_URL}/tasks/${event.taskId}`;
  const oldStatusEmoji = getStatusEmoji(event.oldStatus);
  const newStatusEmoji = getStatusEmoji(event.newStatus);

  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Task Status Updated*\n\n*${event.taskTitle}*\n${oldStatusEmoji} _${event.oldStatus}_ → ${newStatusEmoji} *${event.newStatus}*`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📁 Project: *${event.projectName}*`,
        } as any,
        {
          type: 'mrkdwn',
          text: `👤 Changed by: *${event.changedByName}*`,
        } as any,
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Task',
            emoji: true,
          },
          url: taskUrl,
          style: 'primary',
          action_id: 'view_task',
        },
      ],
    },
  ];

  return {
    text: `Task "${event.taskTitle}" moved from ${event.oldStatus} to ${event.newStatus}`,
    blocks,
  };
}

/**
 * Build mention notification message
 */
export function buildMentionMessage(event: MentionEvent): SlackMessage {
  const taskUrl = `${FRONTEND_URL}/tasks/${event.taskId}`;

  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*You were mentioned* 💬\n\n*${event.mentionedByName}* mentioned you in a comment on *${event.taskTitle}*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `> ${truncateText(event.commentContent, 200)}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📁 Project: *${event.projectName}*`,
        } as any,
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Comment',
            emoji: true,
          },
          url: taskUrl,
          style: 'primary',
          action_id: 'view_task',
        },
      ],
    },
  ];

  return {
    text: `${event.mentionedByName} mentioned you in "${event.taskTitle}"`,
    blocks,
  };
}

/**
 * Build due date reminder message
 */
export function buildDueDateReminderMessage(event: DueDateEvent): SlackMessage {
  const taskUrl = `${FRONTEND_URL}/tasks/${event.taskId}`;
  const priorityEmoji = getPriorityEmoji(event.taskPriority);
  const urgencyText = getUrgencyText(event.hoursUntilDue);
  const urgencyEmoji = getUrgencyEmoji(event.hoursUntilDue);

  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${urgencyEmoji} Task Due ${urgencyText}*\n\n*${event.taskTitle}*${event.taskDescription ? `\n${truncateText(event.taskDescription, 150)}` : ''}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${priorityEmoji} Priority: *${event.taskPriority}*`,
        } as any,
        {
          type: 'mrkdwn',
          text: `📅 Due: *${formatDate(event.taskDueDate)}*`,
        } as any,
        {
          type: 'mrkdwn',
          text: `📁 Project: *${event.projectName}*`,
        } as any,
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Task',
            emoji: true,
          },
          url: taskUrl,
          style: 'danger',
          action_id: 'view_task',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Mark as Done',
            emoji: true,
          },
          value: event.taskId,
          action_id: 'mark_task_done',
        },
      ],
    },
  ];

  return {
    text: `Task "${event.taskTitle}" is due ${urgencyText}`,
    blocks,
  };
}

/**
 * Build sprint event message
 */
export function buildSprintEventMessage(event: SprintEvent): SlackMessage {
  const projectUrl = `${FRONTEND_URL}/projects/${event.projectId}`;

  let headerText = '';
  let emoji = '';

  switch (event.eventType) {
    case 'started':
      headerText = 'Sprint Started';
      emoji = '🚀';
      break;
    case 'completed':
      headerText = 'Sprint Completed';
      emoji = '🎉';
      break;
    case 'cancelled':
      headerText = 'Sprint Cancelled';
      emoji = '⚠️';
      break;
  }

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${headerText}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${event.sprintName}*${event.sprintGoal ? `\n_Goal: ${event.sprintGoal}_` : ''}`,
      },
    },
  ];

  if (event.sprintStartDate && event.sprintEndDate) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📅 ${formatDate(event.sprintStartDate)} - ${formatDate(event.sprintEndDate)}`,
        } as any,
        {
          type: 'mrkdwn',
          text: `📁 Project: *${event.projectName}*`,
        } as any,
      ],
    });
  }

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Project',
          emoji: true,
        },
        url: projectUrl,
        style: 'primary',
        action_id: 'view_project',
      },
    ],
  });

  return {
    text: `${headerText}: ${event.sprintName}`,
    blocks,
  };
}

/**
 * Build task completion confirmation message (for interactive button)
 */
export function buildTaskCompletionMessage(taskTitle: string): SlackMessage {
  return {
    text: `Task "${taskTitle}" marked as done! ✅`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *Task completed!*\n\n"${taskTitle}" has been marked as done.`,
        },
      },
    ],
  };
}

// =============================================
// Helper Functions
// =============================================

function getPriorityEmoji(priority: string): string {
  switch (priority.toUpperCase()) {
    case 'CRITICAL':
      return '🔴';
    case 'HIGH':
      return '🟠';
    case 'MEDIUM':
      return '🟡';
    case 'LOW':
      return '🟢';
    default:
      return '⚪';
  }
}

function getStatusEmoji(status: string): string {
  switch (status.toUpperCase()) {
    case 'TODO':
      return '📋';
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return '🔄';
    case 'DONE':
      return '✅';
    case 'BLOCKED':
      return '🚫';
    case 'CANCELLED':
      return '❌';
    default:
      return '⚪';
  }
}

function getUrgencyEmoji(hoursUntilDue: number): string {
  if (hoursUntilDue <= 2) return '🔴';
  if (hoursUntilDue <= 24) return '🟠';
  if (hoursUntilDue <= 48) return '🟡';
  return '🔵';
}

function getUrgencyText(hoursUntilDue: number): string {
  if (hoursUntilDue <= 0) return 'Now (Overdue)';
  if (hoursUntilDue <= 1) return 'in 1 hour';
  if (hoursUntilDue <= 24) return `in ${Math.floor(hoursUntilDue)} hours`;
  const days = Math.floor(hoursUntilDue / 24);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Slack Interactive Message Webhook Handler
 * Handles button clicks and other interactions from Slack messages
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@teamflow/database';
import { buildTaskCompletionMessage } from './slack.messages';
import SlackService from '../../services/slack.service';
import type { SlackInteractionPayload } from './slack.types';

const prisma = new PrismaClient();

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';

/**
 * Verify Slack request signature
 * Ensures the request actually came from Slack
 */
function verifySlackSignature(req: Request): boolean {
  const slackSignature = req.headers['x-slack-signature'] as string;
  const slackTimestamp = req.headers['x-slack-request-timestamp'] as string;

  if (!slackSignature || !slackTimestamp) {
    return false;
  }

  // Reject requests older than 5 minutes (replay attack protection)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(slackTimestamp)) > 300) {
    return false;
  }

  // Compute signature
  const sigBasestring = `v0:${slackTimestamp}:${JSON.stringify(req.body)}`;
  const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET);
  hmac.update(sigBasestring);
  const computedSignature = `v0=${hmac.digest('hex')}`;

  // Compare signatures (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(slackSignature)
  );
}

/**
 * Handle Slack interactive messages
 * POST /api/slack/webhook/interactions
 */
export async function handleInteractions(req: Request, res: Response, next: NextFunction) {
  try {
    // Verify request came from Slack
    if (!verifySlackSignature(req)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Slack signature',
      });
    }

    // Parse payload (Slack sends it as form-encoded)
    const payload: SlackInteractionPayload =
      typeof req.body.payload === 'string'
        ? JSON.parse(req.body.payload)
        : req.body;

    // Handle different interaction types
    if (payload.type === 'block_actions' && payload.actions && payload.actions.length > 0) {
      const action = payload.actions[0];

      // Handle "Mark as Done" button
      if (action.action_id === 'mark_task_done' && action.value) {
        await handleMarkTaskDone(payload, action.value, res);
        return;
      }

      // Handle "View Task" button (URL button - no server-side action needed)
      if (action.action_id === 'view_task') {
        // Acknowledge the interaction
        res.status(200).send();
        return;
      }
    }

    // Unknown interaction type - acknowledge and ignore
    res.status(200).send();
  } catch (error) {
    console.error('Slack webhook error:', error);
    next(error);
  }
}

/**
 * Handle "Mark as Done" button click
 */
async function handleMarkTaskDone(
  payload: SlackInteractionPayload,
  taskId: string,
  res: Response
) {
  try {
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                slackIntegration: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(200).json({
        response_type: 'ephemeral',
        text: 'Task not found',
      });
    }

    // Update task status to DONE
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'DONE' },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        entityType: 'TASK',
        entityId: taskId,
        action: 'STATUS_CHANGED',
        userId: null, // Null because it was done via Slack
        workspaceId: task.project.workspaceId,
        metadata: {
          source: 'slack',
          slackUserId: payload.user.id,
          slackUserName: payload.user.name,
          oldStatus: task.status,
          newStatus: 'DONE',
        },
      },
    });

    // Build confirmation message
    const confirmationMessage = buildTaskCompletionMessage(task.title);

    // Update the original message
    if (payload.container?.message_ts && payload.channel?.id) {
      try {
        await SlackService.updateMessage(
          task.project.workspaceId,
          payload.channel.id,
          payload.container.message_ts,
          confirmationMessage
        );
      } catch (error) {
        console.error('Failed to update Slack message:', error);
        // Continue anyway - task was updated successfully
      }
    }

    // Send ephemeral confirmation to user
    res.status(200).json({
      response_type: 'ephemeral',
      text: `✅ Task "${task.title}" marked as done!`,
    });
  } catch (error) {
    console.error('Failed to mark task as done:', error);
    res.status(200).json({
      response_type: 'ephemeral',
      text: 'Failed to update task. Please try again.',
    });
  }
}

/**
 * Handle Slack slash commands (future feature)
 * POST /api/slack/webhook/commands
 */
export async function handleSlashCommands(req: Request, res: Response, next: NextFunction) {
  try {
    // Verify request came from Slack
    if (!verifySlackSignature(req)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Slack signature',
      });
    }

    const { command, text, user_id, team_id } = req.body;

    // Placeholder for slash command handling
    // Example: /teamflow create task "Fix bug"

    res.status(200).json({
      response_type: 'ephemeral',
      text: 'Slash commands coming soon! 🚀',
    });
  } catch (error) {
    next(error);
  }
}

import { prisma } from '@teamflow/database';
import { Task, User, AutomationRule, AutomationAction } from '@prisma/client';
import { logger } from '../../utils/logger';

type TriggerType =
  | 'TASK_CREATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_PRIORITY_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_DUE_DATE_SET';

type TriggerContext = {
  task: Task;
  previousTask?: Task;
  workspaceId: string;
  userId: string;
};

/**
 * Execute automations based on a trigger event
 */
export async function executeAutomations(
  triggerType: TriggerType,
  context: TriggerContext
): Promise<void> {
  try {
    // Find all active automation rules for this workspace and trigger type
    const rules = await prisma.automationRule.findMany({
      where: {
        workspaceId: context.workspaceId,
        triggerType,
        isActive: true,
        deletedAt: null,
      },
      include: {
        actions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    logger.info(`Found ${rules.length} automation rules for trigger: ${triggerType}`);

    // Execute each matching rule
    for (const rule of rules) {
      try {
        // Check if trigger conditions are met
        if (shouldTriggerRule(rule, context)) {
          logger.info(`Executing automation rule: ${rule.name} (${rule.id})`);
          await executeRule(rule, context);
        }
      } catch (error) {
        logger.error(`Error executing automation rule ${rule.id}:`, error);
        // Continue with other rules even if one fails
      }
    }
  } catch (error) {
    logger.error(`Error in executeAutomations for trigger ${triggerType}:`, error);
  }
}

/**
 * Check if a rule's trigger conditions are met
 */
function shouldTriggerRule(rule: AutomationRule, context: TriggerContext): boolean {
  const config = rule.triggerConfig as any;

  switch (rule.triggerType) {
    case 'TASK_CREATED':
      // Always trigger for task creation
      return true;

    case 'TASK_STATUS_CHANGED':
      if (!context.previousTask) return false;

      // Check if status actually changed
      if (context.task.status === context.previousTask.status) return false;

      // Check from/to status conditions
      if (config.fromStatus && context.previousTask.status !== config.fromStatus) return false;
      if (config.toStatus && context.task.status !== config.toStatus) return false;

      return true;

    case 'TASK_PRIORITY_CHANGED':
      if (!context.previousTask) return false;

      // Check if priority actually changed
      if (context.task.priority === context.previousTask.priority) return false;

      // Check from/to priority conditions
      if (config.fromPriority && context.previousTask.priority !== config.fromPriority) return false;
      if (config.toPriority && context.task.priority !== config.toPriority) return false;

      return true;

    case 'TASK_ASSIGNED':
      if (!context.previousTask) return false;
      // Would need to compare assignees - simplified for now
      return true;

    case 'TASK_DUE_DATE_SET':
      if (!context.previousTask) return false;
      // Check if due date was set (changed from null to a value)
      return context.previousTask.dueDate === null && context.task.dueDate !== null;

    default:
      return false;
  }
}

/**
 * Execute all actions for a rule
 */
async function executeRule(
  rule: AutomationRule & { actions: AutomationAction[] },
  context: TriggerContext
): Promise<void> {
  // Create execution record
  const execution = await prisma.automationExecution.create({
    data: {
      ruleId: rule.id,
      taskId: context.task.id,
      status: 'PENDING',
      trigger: {
        userId: context.userId,
        triggerType: rule.triggerType,
        taskId: context.task.id,
      },
    },
  });

  try {
    // Execute each action in order
    for (const action of rule.actions) {
      await executeAction(action, context);
    }

    // Update execution as successful
    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: {
        status: 'SUCCESS',
        result: {
          success: true,
          actionsExecuted: rule.actions.length,
          executedAt: new Date().toISOString(),
        },
      },
    });

    // Update rule's last run time
    await prisma.automationRule.update({
      where: { id: rule.id },
      data: { lastRunAt: new Date() },
    });

    logger.info(`Successfully executed automation rule: ${rule.name}`);
  } catch (error) {
    // Update execution as failed
    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        result: {
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date().toISOString(),
        },
      },
    });

    throw error;
  }
}

/**
 * Execute a single automation action
 */
async function executeAction(action: AutomationAction, context: TriggerContext): Promise<void> {
  const config = action.actionConfig as any;

  logger.info(`Executing action: ${action.actionType} on task ${context.task.id}`);

  switch (action.actionType) {
    case 'UPDATE_STATUS':
      if (!config.status) {
        throw new Error('UPDATE_STATUS action requires status in config');
      }
      await prisma.task.update({
        where: { id: context.task.id },
        data: { status: config.status },
      });
      logger.info(`Updated task status to: ${config.status}`);
      break;

    case 'UPDATE_PRIORITY':
      if (!config.priority) {
        throw new Error('UPDATE_PRIORITY action requires priority in config');
      }
      await prisma.task.update({
        where: { id: context.task.id },
        data: { priority: config.priority },
      });
      logger.info(`Updated task priority to: ${config.priority}`);
      break;

    case 'ASSIGN_USER':
      if (!config.userId) {
        throw new Error('ASSIGN_USER action requires userId in config');
      }
      // Add assignee if not already assigned
      await prisma.taskAssignee.upsert({
        where: {
          taskId_userId: {
            taskId: context.task.id,
            userId: config.userId,
          },
        },
        create: {
          taskId: context.task.id,
          userId: config.userId,
        },
        update: {}, // No-op if already exists
      });
      logger.info(`Assigned task to user: ${config.userId}`);
      break;

    case 'ADD_LABEL':
      if (!config.labelId) {
        throw new Error('ADD_LABEL action requires labelId in config');
      }
      // Add label if not already added
      await prisma.taskLabel.upsert({
        where: {
          taskId_labelId: {
            taskId: context.task.id,
            labelId: config.labelId,
          },
        },
        create: {
          taskId: context.task.id,
          labelId: config.labelId,
        },
        update: {}, // No-op if already exists
      });
      logger.info(`Added label to task: ${config.labelId}`);
      break;

    case 'SET_DUE_DATE':
      if (!config.daysFromNow) {
        throw new Error('SET_DUE_DATE action requires daysFromNow in config');
      }
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + config.daysFromNow);
      await prisma.task.update({
        where: { id: context.task.id },
        data: { dueDate },
      });
      logger.info(`Set task due date to: ${dueDate.toISOString()}`);
      break;

    case 'SEND_NOTIFICATION':
      if (!config.userIds || config.userIds.length === 0) {
        throw new Error('SEND_NOTIFICATION action requires userIds in config');
      }
      // This would integrate with your notification service
      logger.info(`Would send notification to users: ${config.userIds.join(', ')}`);
      // TODO: Implement actual notification sending
      break;

    case 'POST_COMMENT':
      if (!config.comment) {
        throw new Error('POST_COMMENT action requires comment in config');
      }
      // This would create a comment on the task
      logger.info(`Would post comment: ${config.comment}`);
      // TODO: Implement task comments if not already available
      break;

    case 'SEND_SLACK_MESSAGE':
      if (!config.channelId || !config.message) {
        throw new Error('SEND_SLACK_MESSAGE action requires channelId and message in config');
      }
      logger.info(`Would send Slack message to channel: ${config.channelId}`);
      // TODO: Implement Slack integration
      break;

    default:
      logger.warn(`Unknown action type: ${action.actionType}`);
  }
}

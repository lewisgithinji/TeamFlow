import { prisma } from '@teamflow/database';
import { CreateAutomationRuleDto, ListAutomationRulesQuery } from './automation.dto';

/**
 * List all automation rules for a workspace
 */
export async function listAutomationRules(
  workspaceId: string,
  query: ListAutomationRulesQuery,
  userId: string
) {
  const { isActive, triggerType, page = 1, limit = 20 } = query;

  // Verify user has access to workspace
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  // Build where clause
  const where: any = {
    workspaceId,
    deletedAt: null,
  };

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (triggerType) {
    where.triggerType = triggerType;
  }

  // Get total count for pagination
  const total = await prisma.automationRule.count({ where });

  // Get rules with actions
  const rules = await prisma.automationRule.findMany({
    where,
    include: {
      actions: {
        orderBy: {
          order: 'asc',
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
      _count: {
        select: {
          executions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    rules,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single automation rule by ID
 */
export async function getAutomationRule(ruleId: string, workspaceId: string, userId: string) {
  // Verify user has access to workspace
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  // Get rule
  const rule = await prisma.automationRule.findFirst({
    where: {
      id: ruleId,
      workspaceId,
      deletedAt: null,
    },
    include: {
      actions: {
        orderBy: {
          order: 'asc',
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
      executions: {
        orderBy: {
          executedAt: 'desc',
        },
        take: 10, // Last 10 executions
        select: {
          id: true,
          status: true,
          trigger: true,
          result: true,
          error: true,
          executedAt: true,
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      _count: {
        select: {
          executions: true,
        },
      },
    },
  });

  if (!rule) {
    throw new Error('Automation rule not found');
  }

  return rule;
}

/**
 * Create a new automation rule
 */
export async function createAutomationRule(
  workspaceId: string,
  data: CreateAutomationRuleDto,
  userId: string
) {
  // Verify user has access to workspace and has ADMIN or OWNER role
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  if (member.role !== 'ADMIN' && member.role !== 'OWNER') {
    throw new Error('Only workspace admins and owners can create automation rules');
  }

  // Check if rule name already exists in workspace
  const existingRule = await prisma.automationRule.findFirst({
    where: {
      workspaceId,
      name: data.name,
      deletedAt: null,
    },
  });

  if (existingRule) {
    throw new Error('An automation rule with this name already exists in this workspace');
  }

  // Validate action configurations based on action type
  for (const action of data.actions) {
    const config = action.actionConfig as any;

    switch (action.actionType) {
      case 'UPDATE_STATUS':
        if (!config.status) {
          throw new Error(`Action "${action.actionType}" requires a status to be configured`);
        }
        break;
      case 'UPDATE_PRIORITY':
        if (!config.priority) {
          throw new Error(`Action "${action.actionType}" requires a priority to be configured`);
        }
        break;
      case 'ASSIGN_USER':
        if (!config.userId) {
          throw new Error(`Action "${action.actionType}" requires a user to be configured`);
        }
        break;
      case 'ADD_LABEL':
      case 'REMOVE_LABEL':
        if (!config.labelId) {
          throw new Error(`Action "${action.actionType}" requires a label to be configured`);
        }
        break;
      case 'ADD_COMMENT':
        if (!config.comment || !config.comment.trim()) {
          throw new Error(`Action "${action.actionType}" requires a comment to be configured`);
        }
        break;
      case 'SEND_NOTIFICATION':
        if (!config.title || !config.title.trim()) {
          throw new Error(`Action "${action.actionType}" requires a notification title`);
        }
        if (!config.message || !config.message.trim()) {
          throw new Error(`Action "${action.actionType}" requires a notification message`);
        }
        break;
      case 'SEND_EMAIL':
        if (!config.to || !config.to.trim()) {
          throw new Error(`Action "${action.actionType}" requires a recipient email`);
        }
        if (!config.subject || !config.subject.trim()) {
          throw new Error(`Action "${action.actionType}" requires an email subject`);
        }
        if (!config.body || !config.body.trim()) {
          throw new Error(`Action "${action.actionType}" requires an email body`);
        }
        break;
      case 'WEBHOOK_CALL':
        if (!config.url || !config.url.trim()) {
          throw new Error(`Action "${action.actionType}" requires a webhook URL`);
        }
        if (!config.method) {
          throw new Error(`Action "${action.actionType}" requires an HTTP method`);
        }
        break;
      case 'MOVE_TO_SPRINT':
        if (!config.sprintId) {
          throw new Error(`Action "${action.actionType}" requires a sprint to be configured`);
        }
        break;
      case 'UNASSIGN_USER':
        // No config validation needed
        break;
    }
  }

  // Create rule with actions
  const rule = await prisma.automationRule.create({
    data: {
      workspaceId,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      triggerType: data.triggerType,
      triggerConfig: data.triggerConfig as any,
      createdBy: userId,
      actions: {
        create: data.actions.map((action) => ({
          order: action.order,
          actionType: action.actionType,
          actionConfig: action.actionConfig as any,
        })),
      },
    },
    include: {
      actions: {
        orderBy: {
          order: 'asc',
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

  return rule;
}

/**
 * Update an existing automation rule
 */
export async function updateAutomationRule(
  ruleId: string,
  workspaceId: string,
  data: CreateAutomationRuleDto,
  userId: string
) {
  // Verify user has access to workspace and has ADMIN or OWNER role
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  if (member.role !== 'ADMIN' && member.role !== 'OWNER') {
    throw new Error('Only workspace admins and owners can update automation rules');
  }

  // Verify rule exists and belongs to workspace
  const existingRule = await prisma.automationRule.findFirst({
    where: {
      id: ruleId,
      workspaceId,
      deletedAt: null,
    },
  });

  if (!existingRule) {
    throw new Error('Automation rule not found');
  }

  // Check if name conflict with other rules
  if (data.name !== existingRule.name) {
    const nameConflict = await prisma.automationRule.findFirst({
      where: {
        workspaceId,
        name: data.name,
        id: { not: ruleId },
        deletedAt: null,
      },
    });

    if (nameConflict) {
      throw new Error('An automation rule with this name already exists in this workspace');
    }
  }

  // Validate action configurations based on action type
  for (const action of data.actions) {
    const config = action.actionConfig as any;

    switch (action.actionType) {
      case 'UPDATE_STATUS':
        if (!config.status) {
          throw new Error(`Action "${action.actionType}" requires a status to be configured`);
        }
        break;
      case 'UPDATE_PRIORITY':
        if (!config.priority) {
          throw new Error(`Action "${action.actionType}" requires a priority to be configured`);
        }
        break;
      case 'ASSIGN_USER':
        if (!config.userId) {
          throw new Error(`Action "${action.actionType}" requires a user to be configured`);
        }
        break;
      case 'ADD_LABEL':
      case 'REMOVE_LABEL':
        if (!config.labelId) {
          throw new Error(`Action "${action.actionType}" requires a label to be configured`);
        }
        break;
      case 'ADD_COMMENT':
        if (!config.comment || !config.comment.trim()) {
          throw new Error(`Action "${action.actionType}" requires a comment to be configured`);
        }
        break;
      case 'SEND_NOTIFICATION':
        if (!config.title || !config.title.trim()) {
          throw new Error(`Action "${action.actionType}" requires a notification title`);
        }
        if (!config.message || !config.message.trim()) {
          throw new Error(`Action "${action.actionType}" requires a notification message`);
        }
        break;
      case 'SEND_EMAIL':
        if (!config.to || !config.to.trim()) {
          throw new Error(`Action "${action.actionType}" requires a recipient email`);
        }
        if (!config.subject || !config.subject.trim()) {
          throw new Error(`Action "${action.actionType}" requires an email subject`);
        }
        if (!config.body || !config.body.trim()) {
          throw new Error(`Action "${action.actionType}" requires an email body`);
        }
        break;
      case 'WEBHOOK_CALL':
        if (!config.url || !config.url.trim()) {
          throw new Error(`Action "${action.actionType}" requires a webhook URL`);
        }
        if (!config.method) {
          throw new Error(`Action "${action.actionType}" requires an HTTP method`);
        }
        break;
      case 'MOVE_TO_SPRINT':
        if (!config.sprintId) {
          throw new Error(`Action "${action.actionType}" requires a sprint to be configured`);
        }
        break;
      case 'UNASSIGN_USER':
        // No config validation needed
        break;
    }
  }

  // Delete existing actions and create new ones
  await prisma.automationAction.deleteMany({
    where: { ruleId },
  });

  // Update rule with new actions
  const rule = await prisma.automationRule.update({
    where: { id: ruleId },
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? existingRule.isActive,
      triggerType: data.triggerType,
      triggerConfig: data.triggerConfig as any,
      actions: {
        create: data.actions.map((action) => ({
          order: action.order,
          actionType: action.actionType,
          actionConfig: action.actionConfig as any,
        })),
      },
    },
    include: {
      actions: {
        orderBy: {
          order: 'asc',
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

  return rule;
}

/**
 * Delete an automation rule (soft delete)
 */
export async function deleteAutomationRule(
  ruleId: string,
  workspaceId: string,
  userId: string
) {
  // Verify user has access to workspace and has ADMIN or OWNER role
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  if (member.role !== 'ADMIN' && member.role !== 'OWNER') {
    throw new Error('Only workspace admins and owners can delete automation rules');
  }

  // Verify rule exists and belongs to workspace
  const existingRule = await prisma.automationRule.findFirst({
    where: {
      id: ruleId,
      workspaceId,
      deletedAt: null,
    },
  });

  if (!existingRule) {
    throw new Error('Automation rule not found');
  }

  // Soft delete
  await prisma.automationRule.update({
    where: { id: ruleId },
    data: {
      deletedAt: new Date(),
      isActive: false, // Also deactivate
    },
  });
}

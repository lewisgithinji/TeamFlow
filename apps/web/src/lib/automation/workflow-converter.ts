import { Node, Edge } from 'reactflow';
import { AutomationRule, WorkflowState, TriggerNodeData, ActionNodeData } from './types';
import { TRIGGER_TYPES, ACTION_TYPES } from './constants';

/**
 * Convert React Flow workflow to API format
 */
export function workflowToAPI(workflow: WorkflowState, workspaceId: string, name: string, description?: string, forUpdate = false): any {
  // Find trigger node
  const triggerNode = workflow.nodes.find((n) => n.type === 'trigger');
  if (!triggerNode) {
    throw new Error('Workflow must have a trigger node');
  }

  const triggerData = triggerNode.data as TriggerNodeData;

  // Find action nodes and sort by order
  const actionNodes = workflow.nodes
    .filter((n) => n.type === 'action')
    .sort((a, b) => {
      const aData = a.data as ActionNodeData;
      const bData = b.data as ActionNodeData;
      return aData.order - bData.order;
    });

  if (actionNodes.length === 0) {
    throw new Error('Workflow must have at least one action');
  }

  const result: any = {
    name,
    description,
    isActive: true,
    triggerType: triggerData.triggerType,
    triggerConfig: triggerData.config,
    actions: actionNodes.map((node, index) => {
      const data = node.data as ActionNodeData;
      return {
        order: index,
        actionType: data.actionType,
        actionConfig: data.config,
      };
    }),
  };

  // Only include workspaceId for creation, not for updates (it's in the URL)
  if (!forUpdate) {
    result.workspaceId = workspaceId;
  }

  return result;
}

/**
 * Convert API format to React Flow workflow
 */
export function apiToWorkflow(rule: AutomationRule): WorkflowState {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Create trigger node
  const triggerNode: Node = {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: {
      triggerType: rule.triggerType,
      config: rule.triggerConfig,
      label: TRIGGER_TYPES[rule.triggerType]?.label || rule.triggerType,
    },
  };
  nodes.push(triggerNode);

  // Create action nodes
  let previousNodeId = triggerNode.id;
  rule.actions.forEach((action, index) => {
    const actionNode: Node = {
      id: `action-${index + 1}`,
      type: 'action',
      position: { x: 250, y: 200 + index * 150 },
      data: {
        actionType: action.actionType,
        config: action.actionConfig,
        label: ACTION_TYPES[action.actionType]?.label || action.actionType,
        order: action.order,
      },
    };
    nodes.push(actionNode);

    // Create edge from previous node
    edges.push({
      id: `e-${previousNodeId}-${actionNode.id}`,
      source: previousNodeId,
      target: actionNode.id,
      type: 'smoothstep',
      animated: true,
    });

    previousNodeId = actionNode.id;
  });

  return { nodes, edges };
}

/**
 * Validate workflow structure
 */
export function validateWorkflow(workflow: WorkflowState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for trigger node
  const triggerNodes = workflow.nodes.filter((n) => n.type === 'trigger');
  if (triggerNodes.length === 0) {
    errors.push('Workflow must have a trigger node');
  } else if (triggerNodes.length > 1) {
    errors.push('Workflow can only have one trigger node');
  }

  // Check for action nodes
  const actionNodes = workflow.nodes.filter((n) => n.type === 'action');
  if (actionNodes.length === 0) {
    errors.push('Workflow must have at least one action');
  }

  // Validate action configurations
  actionNodes.forEach((node, index) => {
    const data = node.data as ActionNodeData;
    const actionLabel = ACTION_TYPES[data.actionType]?.label || data.actionType;

    // Check if config is empty or missing required fields
    const config = data.config || {};

    switch (data.actionType) {
      case 'UPDATE_STATUS':
        if (!config.status) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please select a status`);
        }
        break;
      case 'UPDATE_PRIORITY':
        if (!config.priority) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please select a priority`);
        }
        break;
      case 'ASSIGN_USER':
        if (!config.userId) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please select a user to assign`);
        }
        break;
      case 'ADD_LABEL':
      case 'REMOVE_LABEL':
        if (!config.labelId) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please select a label`);
        }
        break;
      case 'ADD_COMMENT':
        if (!config.comment || !config.comment.trim()) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please enter a comment`);
        }
        break;
      case 'SEND_NOTIFICATION':
        if (!config.title || !config.title.trim()) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please enter a notification title`);
        }
        if (!config.message || !config.message.trim()) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please enter a notification message`);
        }
        break;
      case 'SEND_EMAIL':
        if (!config.to || !config.to.trim()) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please enter recipient email`);
        }
        if (!config.subject || !config.subject.trim()) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please enter email subject`);
        }
        if (!config.body || !config.body.trim()) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please enter email body`);
        }
        break;
      case 'WEBHOOK_CALL':
        if (!config.url || !config.url.trim()) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please enter webhook URL`);
        }
        if (!config.method) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please select HTTP method`);
        }
        break;
      case 'MOVE_TO_SPRINT':
        if (!config.sprintId) {
          errors.push(`Action #${index + 1} (${actionLabel}): Please select a sprint`);
        }
        break;
      case 'UNASSIGN_USER':
        // No config needed
        break;
      default:
        // Unknown action type
        errors.push(`Action #${index + 1}: Unknown action type "${data.actionType}"`);
    }
  });

  // Validate trigger configuration
  const triggerNode = triggerNodes[0];
  if (triggerNode) {
    const data = triggerNode.data as TriggerNodeData;
    const triggerLabel = TRIGGER_TYPES[data.triggerType]?.label || data.triggerType;
    const config = data.config || {};

    switch (data.triggerType) {
      case 'TASK_STATUS_CHANGED':
        if (!config.toStatus) {
          errors.push(`Trigger (${triggerLabel}): Please select a target status`);
        }
        break;
      case 'DUE_DATE_APPROACHING':
        if (!config.hoursBeforeDue || config.hoursBeforeDue < 1) {
          errors.push(`Trigger (${triggerLabel}): Please specify hours before due date`);
        }
        break;
      case 'PRIORITY_CHANGED':
        if (!config.toPriority) {
          errors.push(`Trigger (${triggerLabel}): Please select a target priority`);
        }
        break;
      case 'LABEL_ADDED':
      case 'LABEL_REMOVED':
        if (!config.labelId) {
          errors.push(`Trigger (${triggerLabel}): Please select a label`);
        }
        break;
      // These triggers don't need config
      case 'TASK_CREATED':
      case 'TASK_ASSIGNED':
      case 'TASK_UNASSIGNED':
      case 'DUE_DATE_PASSED':
      case 'COMMENT_ADDED':
        break;
      default:
        errors.push(`Trigger: Unknown trigger type "${data.triggerType}"`);
    }
  }

  // Check for disconnected nodes
  const connectedNodeIds = new Set<string>();
  workflow.edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  workflow.nodes.forEach((node) => {
    if (!connectedNodeIds.has(node.id) && workflow.nodes.length > 1) {
      errors.push(`Node "${node.data.label}" is not connected`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a new trigger node
 */
export function createTriggerNode(triggerType: string, position?: { x: number; y: number }): Node {
  return {
    id: 'trigger-1',
    type: 'trigger',
    position: position || { x: 250, y: 50 },
    data: {
      triggerType: triggerType as any,
      config: {},
      label: TRIGGER_TYPES[triggerType as keyof typeof TRIGGER_TYPES]?.label || triggerType,
    },
  };
}

/**
 * Create a new action node
 */
export function createActionNode(actionType: string, order: number, position?: { x: number; y: number }): Node {
  return {
    id: `action-${Date.now()}`,
    type: 'action',
    position: position || { x: 250, y: 200 + order * 150 },
    data: {
      actionType: actionType as any,
      config: {},
      label: ACTION_TYPES[actionType as keyof typeof ACTION_TYPES]?.label || actionType,
      order,
    },
  };
}

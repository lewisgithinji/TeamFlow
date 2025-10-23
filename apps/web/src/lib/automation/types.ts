// Automation Types and Interfaces

export type AutomationTriggerType =
  | 'TASK_CREATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_UNASSIGNED'
  | 'DUE_DATE_APPROACHING'
  | 'DUE_DATE_PASSED'
  | 'PRIORITY_CHANGED'
  | 'COMMENT_ADDED'
  | 'LABEL_ADDED'
  | 'LABEL_REMOVED';

export type AutomationActionType =
  | 'UPDATE_STATUS'
  | 'UPDATE_PRIORITY'
  | 'ASSIGN_USER'
  | 'UNASSIGN_USER'
  | 'ADD_LABEL'
  | 'REMOVE_LABEL'
  | 'ADD_COMMENT'
  | 'SEND_NOTIFICATION'
  | 'SEND_EMAIL'
  | 'WEBHOOK_CALL'
  | 'MOVE_TO_SPRINT';

export interface TriggerConfig {
  fromStatus?: string;
  toStatus?: string;
  fromPriority?: string;
  toPriority?: string;
  hoursBeforeDue?: number;
  labelId?: string;
}

export interface ActionConfig {
  status?: string;
  priority?: string;
  userId?: string;
  labelId?: string;
  comment?: string;
  title?: string;
  message?: string;
  to?: string;
  subject?: string;
  body?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  sprintId?: string;
}

export interface AutomationAction {
  id?: string;
  order: number;
  actionType: AutomationActionType;
  actionConfig: ActionConfig;
}

export interface AutomationRule {
  id?: string;
  workspaceId: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: AutomationTriggerType;
  triggerConfig: TriggerConfig;
  actions: AutomationAction[];
  creator?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  lastRunAt?: string;
  _count?: {
    executions: number;
  };
  executions?: AutomationExecution[];
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  taskId?: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'PARTIAL';
  trigger: any;
  result: any;
  error?: string;
  executedAt: string;
  task?: {
    id: string;
    title: string;
  };
}

// React Flow Node Types
export interface TriggerNodeData {
  triggerType: AutomationTriggerType;
  config: TriggerConfig;
  label: string;
}

export interface ActionNodeData {
  actionType: AutomationActionType;
  config: ActionConfig;
  label: string;
  order: number;
}

export type WorkflowNodeType = 'trigger' | 'action';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: TriggerNodeData | ActionNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

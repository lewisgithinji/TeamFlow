export enum TriggerType {
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNEE_CHANGED = 'ASSIGNEE_CHANGED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  DUE_DATE_APPROACHING = 'DUE_DATE_APPROACHING',
  TASK_CREATED = 'TASK_CREATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
}

export enum ActionType {
  CHANGE_STATUS = 'UPDATE_STATUS',
  ASSIGN_TO = 'ASSIGN_USER',
  SET_PRIORITY = 'UPDATE_PRIORITY',
  ADD_LABEL = 'ADD_LABEL',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  ADD_COMMENT = 'ADD_COMMENT',
}

export interface StatusChangedTrigger {
  fromStatus?: string;
  toStatus?: string;
}

export interface AssigneeChangedTrigger {
  fromUserId?: string;
  toUserId?: string;
}

export interface PriorityChangedTrigger {
  fromPriority?: string;
  toPriority?: string;
}

export interface DueDateApproachingTrigger {
  daysBeforeDue: number;
}

export interface TaskCreatedTrigger {
  projectId?: string;
}

export interface CommentAddedTrigger {
  containsKeyword?: string;
}

export type TriggerConfig =
  | StatusChangedTrigger
  | AssigneeChangedTrigger
  | PriorityChangedTrigger
  | DueDateApproachingTrigger
  | TaskCreatedTrigger
  | CommentAddedTrigger;

export interface ChangeStatusAction {
  status: string;
}

export interface AssignToAction {
  userId: string;
}

export interface SetPriorityAction {
  priority: string;
}

export interface AddLabelAction {
  labelId: string;
}

export interface SendNotificationAction {
  title: string;
  message: string;
}

export interface AddCommentAction {
  comment: string;
}

export type ActionConfig =
  | ChangeStatusAction
  | AssignToAction
  | SetPriorityAction
  | AddLabelAction
  | SendNotificationAction
  | AddCommentAction;

export interface AutomationAction {
  id: string;
  ruleId: string;
  actionType: ActionType;
  actionConfig: ActionConfig;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  isActive: boolean;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  actions: AutomationAction[];
  executions?: AutomationExecution[];
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  taskId: string;
  task?: {
    id: string;
    title: string;
  };
  status: ExecutionStatus;
  error?: string;
  executedAt: string;
}

export enum ExecutionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export interface CreateAutomationRuleInput {
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  isActive?: boolean;
  actions: {
    actionType: ActionType;
    actionConfig: ActionConfig;
    order: number;
  }[];
}

export interface UpdateAutomationRuleInput {
  name?: string;
  description?: string;
  triggerType?: TriggerType;
  triggerConfig?: TriggerConfig;
  isActive?: boolean;
  actions?: {
    actionType: ActionType;
    actionConfig: ActionConfig;
    order: number;
  }[];
}

// Helper type for displaying trigger/action metadata
export interface TriggerMetadata {
  type: TriggerType;
  label: string;
  description: string;
  icon?: string;
}

export interface ActionMetadata {
  type: ActionType;
  label: string;
  description: string;
  icon?: string;
}

import { z } from 'zod';

// =============================================
// ENUMS
// =============================================

export const AutomationTriggerTypeSchema = z.enum([
  'TASK_CREATED',
  'TASK_STATUS_CHANGED',
  'TASK_ASSIGNED',
  'TASK_UNASSIGNED',
  'DUE_DATE_APPROACHING',
  'DUE_DATE_PASSED',
  'PRIORITY_CHANGED',
  'COMMENT_ADDED',
  'LABEL_ADDED',
  'LABEL_REMOVED',
]);

export const AutomationActionTypeSchema = z.enum([
  'UPDATE_STATUS',
  'UPDATE_PRIORITY',
  'ASSIGN_USER',
  'UNASSIGN_USER',
  'ADD_LABEL',
  'REMOVE_LABEL',
  'ADD_COMMENT',
  'SEND_NOTIFICATION',
  'SEND_EMAIL',
  'WEBHOOK_CALL',
  'MOVE_TO_SPRINT',
]);

// =============================================
// TRIGGER CONFIGS
// =============================================

export const TaskStatusChangedConfigSchema = z.object({
  fromStatus: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']).optional(),
  toStatus: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']),
});

export const DueDateApproachingConfigSchema = z.object({
  hoursBeforeDue: z.number().min(1).max(720), // 1 hour to 30 days
});

export const PriorityChangedConfigSchema = z.object({
  fromPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  toPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export const LabelConfigSchema = z.object({
  labelId: z.string().uuid(),
});

// Generic trigger config - allow any object since different triggers have different configs
// We'll validate the specific config based on triggerType in the service layer
export const TriggerConfigSchema = z.record(z.any()).default({});

// =============================================
// ACTION CONFIGS
// =============================================

export const UpdateStatusActionConfigSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']),
});

export const UpdatePriorityActionConfigSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export const AssignUserActionConfigSchema = z.object({
  userId: z.string().uuid(),
});

export const LabelActionConfigSchema = z.object({
  labelId: z.string().uuid(),
});

export const AddCommentActionConfigSchema = z.object({
  comment: z.string().min(1).max(5000),
});

export const SendNotificationActionConfigSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
});

export const SendEmailActionConfigSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

export const WebhookCallActionConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH']),
  headers: z.record(z.string()).optional(),
  body: z.record(z.any()).optional(),
});

export const MoveToSprintActionConfigSchema = z.object({
  sprintId: z.string().uuid(),
});

// Generic action config - allow any object since different actions have different configs
// We'll validate the specific config based on actionType in the service layer
export const ActionConfigSchema = z.record(z.any()).default({});

// =============================================
// DTOs
// =============================================

export const CreateAutomationActionSchema = z.object({
  order: z.number().min(0),
  actionType: AutomationActionTypeSchema,
  actionConfig: ActionConfigSchema,
});

export const CreateAutomationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  triggerType: AutomationTriggerTypeSchema,
  triggerConfig: TriggerConfigSchema.default({}),
  actions: z.array(CreateAutomationActionSchema).min(1).max(10),
});

export const UpdateAutomationRuleSchema = CreateAutomationRuleSchema.partial();

export const ListAutomationRulesQuerySchema = z.object({
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  triggerType: AutomationTriggerTypeSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// =============================================
// TYPE EXPORTS
// =============================================

export type AutomationTriggerType = z.infer<typeof AutomationTriggerTypeSchema>;
export type AutomationActionType = z.infer<typeof AutomationActionTypeSchema>;
export type CreateAutomationRuleDto = z.infer<typeof CreateAutomationRuleSchema>;
export type UpdateAutomationRuleDto = z.infer<typeof UpdateAutomationRuleSchema>;
export type ListAutomationRulesQuery = z.infer<typeof ListAutomationRulesQuerySchema>;
export type CreateAutomationAction = z.infer<typeof CreateAutomationActionSchema>;

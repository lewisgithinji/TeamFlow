/**
 * Slack Integration Types and Interfaces
 */

import { z } from 'zod';

// =============================================
// Zod Validation Schemas
// =============================================

export const updateIntegrationSettingsSchema = z.object({
  defaultChannelId: z.string().optional(),
  defaultChannelName: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateIntegrationSettingsDto = z.infer<typeof updateIntegrationSettingsSchema>;

export const createChannelMappingSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  channelName: z.string().min(1, 'Channel name is required'),
  projectId: z.string().uuid('Invalid project ID').optional(),
  notifyOnAssignment: z.boolean().optional().default(true),
  notifyOnStatusChange: z.boolean().optional().default(true),
  notifyOnComment: z.boolean().optional().default(true),
  notifyOnDueDate: z.boolean().optional().default(true),
});

export type CreateChannelMappingDto = z.infer<typeof createChannelMappingSchema>;

export const updateChannelMappingSchema = z.object({
  notifyOnAssignment: z.boolean().optional(),
  notifyOnStatusChange: z.boolean().optional(),
  notifyOnComment: z.boolean().optional(),
  notifyOnDueDate: z.boolean().optional(),
});

export type UpdateChannelMappingDto = z.infer<typeof updateChannelMappingSchema>;

export const updateUserPreferencesSchema = z.object({
  enableDMs: z.boolean().optional(),
  enableChannelPosts: z.boolean().optional(),
  frequency: z.enum(['instant', 'hourly', 'daily', 'disabled']).optional(),
  notifyOnAssignment: z.boolean().optional(),
  notifyOnMention: z.boolean().optional(),
  notifyOnStatusChange: z.boolean().optional(),
  notifyOnComment: z.boolean().optional(),
  notifyOnDueDate: z.boolean().optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    end: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  }).optional(),
});

export type UpdateUserPreferencesDto = z.infer<typeof updateUserPreferencesSchema>;

// =============================================
// Slack API Types
// =============================================

export interface SlackOAuthResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  authed_user?: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
  is_enterprise_install: boolean;
  error?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  is_archived: boolean;
  is_member: boolean;
  num_members?: number;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  profile?: {
    email?: string;
    display_name?: string;
    real_name?: string;
    image_72?: string;
  };
  is_bot: boolean;
  deleted: boolean;
}

// =============================================
// Message Building Types
// =============================================

export interface SlackMessage {
  channel?: string; // Channel ID or user ID for DM
  text: string; // Fallback text
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  thread_ts?: string; // For threaded messages
  mrkdwn?: boolean;
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'actions' | 'context' | 'header' | 'image';
  text?: SlackTextObject;
  fields?: SlackTextObject[];
  accessory?: SlackBlockElement;
  elements?: SlackBlockElement[];
  image_url?: string;
  alt_text?: string;
  block_id?: string;
}

export interface SlackTextObject {
  type: 'mrkdwn' | 'plain_text';
  text: string;
  emoji?: boolean;
  verbatim?: boolean;
}

export interface SlackBlockElement {
  type: 'button' | 'static_select' | 'datepicker' | 'image' | 'overflow';
  text?: SlackTextObject;
  action_id: string;
  value?: string;
  url?: string;
  style?: 'primary' | 'danger';
  confirm?: SlackConfirmObject;
  options?: SlackOption[];
  initial_date?: string;
  placeholder?: SlackTextObject;
}

export interface SlackOption {
  text: SlackTextObject;
  value: string;
  description?: SlackTextObject;
}

export interface SlackConfirmObject {
  title: SlackTextObject;
  text: SlackTextObject;
  confirm: SlackTextObject;
  deny: SlackTextObject;
  style?: 'primary' | 'danger';
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

// =============================================
// TeamFlow-Slack Integration Types
// =============================================

export interface SlackIntegrationConfig {
  workspaceId: string;
  accessToken: string; // Encrypted
  botUserId: string;
  teamId: string;
  teamName: string;
  defaultChannelId?: string;
  defaultChannelName?: string;
  installedBy: string;
}

export interface SlackChannelMappingConfig {
  integrationId: string;
  projectId?: string;
  channelId: string;
  channelName: string;
  channelType: 'public' | 'private' | 'dm';
  notifyOnAssignment?: boolean;
  notifyOnStatusChange?: boolean;
  notifyOnComment?: boolean;
  notifyOnDueDate?: boolean;
}

export interface SlackUserPreferenceConfig {
  userId: string;
  integrationId: string;
  slackUserId?: string;
  slackUserName?: string;
  enableDMs?: boolean;
  enableChannelPosts?: boolean;
  frequency?: 'instant' | 'hourly' | 'daily' | 'disabled';
  notifyOnAssignment?: boolean;
  notifyOnMention?: boolean;
  notifyOnStatusChange?: boolean;
  notifyOnComment?: boolean;
  notifyOnDueDate?: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
  };
}

// =============================================
// Notification Event Types
// =============================================

export interface TaskAssignmentEvent {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  taskPriority: string;
  taskStatus: string;
  taskDueDate?: Date;
  projectId: string;
  projectName: string;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  assignedBy: string;
  assignedByName: string;
  workspaceId: string;
}

export interface StatusChangeEvent {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  projectId: string;
  projectName: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedByName: string;
  workspaceId: string;
}

export interface MentionEvent {
  taskId: string;
  taskTitle: string;
  commentId: string;
  commentContent: string;
  projectId: string;
  projectName: string;
  mentionedUserId: string;
  mentionedUserName: string;
  mentionedUserEmail: string;
  mentionedBy: string;
  mentionedByName: string;
  workspaceId: string;
}

export interface DueDateEvent {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  taskPriority: string;
  taskStatus: string;
  taskDueDate: Date;
  projectId: string;
  projectName: string;
  assigneeIds: string[];
  workspaceId: string;
  hoursUntilDue: number;
}

export interface SprintEvent {
  sprintId: string;
  sprintName: string;
  sprintGoal?: string;
  sprintStartDate?: Date;
  sprintEndDate?: Date;
  projectId: string;
  projectName: string;
  workspaceId: string;
  eventType: 'started' | 'completed' | 'cancelled';
}

// =============================================
// Slack Interactive Message Types
// =============================================

export interface SlackInteractionPayload {
  type: 'block_actions' | 'view_submission' | 'shortcut';
  user: {
    id: string;
    username: string;
    name: string;
    team_id: string;
  };
  api_app_id: string;
  token: string;
  container?: {
    type: string;
    message_ts?: string;
    channel_id?: string;
    is_ephemeral?: boolean;
  };
  trigger_id?: string;
  team: {
    id: string;
    domain: string;
  };
  channel?: {
    id: string;
    name: string;
  };
  message?: {
    type: string;
    user: string;
    ts: string;
    text: string;
  };
  actions?: Array<{
    type: string;
    action_id: string;
    block_id?: string;
    value?: string;
    action_ts?: string;
  }>;
  response_url?: string;
  view?: any;
}

// =============================================
// Service Method Return Types
// =============================================

export interface SlackServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SlackChannelListResult {
  channels: SlackChannel[];
  nextCursor?: string;
}

export interface SlackMessageResult {
  ok: boolean;
  channel: string;
  ts: string;
  message?: {
    text: string;
    user: string;
    ts: string;
  };
}

import { AutomationTriggerType, AutomationActionType } from './types';

// Trigger Type Definitions
export const TRIGGER_TYPES: Record<AutomationTriggerType, { label: string; description: string; icon: string }> = {
  TASK_CREATED: {
    label: 'Task Created',
    description: 'When a new task is created',
    icon: '➕',
  },
  TASK_STATUS_CHANGED: {
    label: 'Status Changed',
    description: 'When a task status changes',
    icon: '🔄',
  },
  TASK_ASSIGNED: {
    label: 'Task Assigned',
    description: 'When a task is assigned to someone',
    icon: '👤',
  },
  TASK_UNASSIGNED: {
    label: 'Task Unassigned',
    description: 'When a task is unassigned',
    icon: '👤',
  },
  DUE_DATE_APPROACHING: {
    label: 'Due Date Approaching',
    description: 'When a due date is getting close',
    icon: '⏰',
  },
  DUE_DATE_PASSED: {
    label: 'Due Date Passed',
    description: 'When a due date has passed',
    icon: '⚠️',
  },
  PRIORITY_CHANGED: {
    label: 'Priority Changed',
    description: 'When task priority changes',
    icon: '🎯',
  },
  COMMENT_ADDED: {
    label: 'Comment Added',
    description: 'When a comment is added',
    icon: '💬',
  },
  LABEL_ADDED: {
    label: 'Label Added',
    description: 'When a label is added',
    icon: '🏷️',
  },
  LABEL_REMOVED: {
    label: 'Label Removed',
    description: 'When a label is removed',
    icon: '🏷️',
  },
};

// Action Type Definitions
export const ACTION_TYPES: Record<AutomationActionType, { label: string; description: string; icon: string }> = {
  UPDATE_STATUS: {
    label: 'Update Status',
    description: 'Change task status',
    icon: '🔄',
  },
  UPDATE_PRIORITY: {
    label: 'Update Priority',
    description: 'Change task priority',
    icon: '🎯',
  },
  ASSIGN_USER: {
    label: 'Assign User',
    description: 'Assign task to a user',
    icon: '👤',
  },
  UNASSIGN_USER: {
    label: 'Unassign User',
    description: 'Remove user assignment',
    icon: '👤',
  },
  ADD_LABEL: {
    label: 'Add Label',
    description: 'Add a label to task',
    icon: '🏷️',
  },
  REMOVE_LABEL: {
    label: 'Remove Label',
    description: 'Remove a label from task',
    icon: '🏷️',
  },
  ADD_COMMENT: {
    label: 'Add Comment',
    description: 'Add a comment to task',
    icon: '💬',
  },
  SEND_NOTIFICATION: {
    label: 'Send Notification',
    description: 'Send in-app notification',
    icon: '🔔',
  },
  SEND_EMAIL: {
    label: 'Send Email',
    description: 'Send email notification',
    icon: '📧',
  },
  WEBHOOK_CALL: {
    label: 'Call Webhook',
    description: 'Send HTTP request',
    icon: '🌐',
  },
  MOVE_TO_SPRINT: {
    label: 'Move to Sprint',
    description: 'Move task to a sprint',
    icon: '📅',
  },
};

// Task Status Options
export const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'DONE', label: 'Done', color: 'bg-green-100 text-green-800' },
  { value: 'BLOCKED', label: 'Blocked', color: 'bg-red-100 text-red-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-100 text-gray-600' },
];

// Task Priority Options
export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

// HTTP Methods
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// Due Date Hours Options
export const DUE_DATE_HOURS = [
  { value: 1, label: '1 hour' },
  { value: 6, label: '6 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
  { value: 72, label: '3 days' },
  { value: 168, label: '1 week' },
];

import { z } from 'zod';

// Workspace Enums
export const WorkspaceRole = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export type WorkspaceRole = z.infer<typeof WorkspaceRole>;

// Task Enums
export const TaskStatus = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type TaskPriority = z.infer<typeof TaskPriority>;

// Project Enums
export const ProjectVisibility = z.enum(['PUBLIC', 'PRIVATE']);
export type ProjectVisibility = z.infer<typeof ProjectVisibility>;

// Sprint Enums
export const SprintStatus = z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
export type SprintStatus = z.infer<typeof SprintStatus>;

// Integration Enums
export const IntegrationType = z.enum(['SLACK', 'GITHUB', 'JIRA', 'WEBHOOK']);
export type IntegrationType = z.infer<typeof IntegrationType>;

export const IntegrationStatus = z.enum(['ACTIVE', 'INACTIVE', 'ERROR']);
export type IntegrationStatus = z.infer<typeof IntegrationStatus>;

// Activity Enums
export const EntityType = z.enum(['TASK', 'PROJECT', 'WORKSPACE', 'COMMENT', 'SPRINT']);
export type EntityType = z.infer<typeof EntityType>;

export const ActivityAction = z.enum([
  'CREATED',
  'UPDATED',
  'DELETED',
  'ASSIGNED',
  'COMMENTED',
  'STATUS_CHANGED',
  'MOVED',
]);
export type ActivityAction = z.infer<typeof ActivityAction>;

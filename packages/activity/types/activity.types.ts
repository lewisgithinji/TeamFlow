import { EntityType, ActivityAction } from '@teamflow/database';

export interface Activity {
  id: string;
  workspaceId: string;
  userId: string | null;
  entityType: EntityType;
  entityId: string;
  action: ActivityAction;
  metadata: Record<string, any>;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  workspace?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
    projectId: string;
  } | null;
}

export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'COMMENT_CREATED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_UPDATED';

export interface CreateActivityInput {
  workspaceId: string;
  userId?: string;
  entityType: EntityType;
  entityId: string;
  action: ActivityAction;
  metadata?: Record<string, any>;
}

export interface ActivityFilters {
  workspaceId?: string;
  userId?: string;
  entityType?: EntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ActivityListResult {
  activities: Activity[];
  total: number;
  hasMore: boolean;
}

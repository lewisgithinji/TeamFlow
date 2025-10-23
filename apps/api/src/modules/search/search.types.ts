import { TaskStatus, TaskPriority } from '@prisma/client';

export interface SearchQuery {
  q?: string; // Search query text
  workspaceId?: string;
  projectId?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  labelId?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  createdBy?: string;
  sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  tasks: TaskSearchResult[];
  total: number;
  hasMore: boolean;
}

export interface TaskSearchResult {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  projectId: string;
  projectName: string;
  assignees: {
    id: string;
    name: string;
    avatar: string | null;
  }[];
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  relevance?: number;
}

export interface SavedFilterInput {
  name: string;
  description?: string;
  workspaceId: string;
  filters: SearchQuery;
  isPublic?: boolean;
}

export interface SavedFilterResponse {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  createdBy: string;
  isPublic: boolean;
  filters: SearchQuery;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

'use client';

import { useEffect, useState } from 'react';
import { useActivityStore } from '@/stores/activity.store';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  workspaceId?: string;
  showFilters?: boolean;
}

// Action labels based on ActivityAction enum
const actionLabels: Record<string, string> = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  ASSIGNED: 'assigned',
  COMMENTED: 'commented on',
  STATUS_CHANGED: 'changed status of',
  MOVED: 'moved',
};

// Entity type labels
const entityLabels: Record<string, string> = {
  TASK: 'task',
  PROJECT: 'project',
  WORKSPACE: 'workspace',
  COMMENT: 'comment',
  SPRINT: 'sprint',
};

// Colors based on action
const actionColors: Record<string, string> = {
  CREATED: 'bg-blue-100 text-blue-800',
  UPDATED: 'bg-yellow-100 text-yellow-800',
  DELETED: 'bg-red-100 text-red-800',
  ASSIGNED: 'bg-purple-100 text-purple-800',
  COMMENTED: 'bg-indigo-100 text-indigo-800',
  STATUS_CHANGED: 'bg-green-100 text-green-800',
  MOVED: 'bg-orange-100 text-orange-800',
};

export function ActivityFeed({ workspaceId, showFilters = true }: ActivityFeedProps) {
  const {
    activities,
    isLoading,
    error,
    hasMore,
    fetchActivities,
    loadMore,
    setFilters,
    currentFilters,
  } = useActivityStore();

  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities({
      workspaceId,
    });
  }, [workspaceId, fetchActivities]);

  const handleEntityTypeFilterChange = (entityType: string) => {
    setEntityTypeFilter(entityType);
    setFilters({
      ...currentFilters,
      entityType: entityType || undefined,
      workspaceId,
    });
  };

  const getActivityIcon = (entityType: string) => {
    if (!entityType) return '•';

    switch (entityType) {
      case 'TASK':
        return '✓';
      case 'COMMENT':
        return '💬';
      case 'PROJECT':
        return '📁';
      case 'WORKSPACE':
        return '🏢';
      case 'SPRINT':
        return '🏃';
      default:
        return '•';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-3">
          <select
            value={entityTypeFilter}
            onChange={(e) => handleEntityTypeFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="TASK">Tasks</option>
            <option value="COMMENT">Comments</option>
            <option value="PROJECT">Projects</option>
            <option value="WORKSPACE">Workspaces</option>
            <option value="SPRINT">Sprints</option>
          </select>
        </div>
      )}

      {/* Activity List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading && activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No activities found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${actionColors[activity.action] || 'bg-gray-100 text-gray-800'}`}>
                    {getActivityIcon(activity.entityType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user?.name || 'System'}</span>
                      {' '}
                      <span className="text-gray-600">
                        {actionLabels[activity.action] || activity.action.toLowerCase()} {entityLabels[activity.entityType] || activity.entityType.toLowerCase()}
                      </span>
                    </p>

                    {/* Metadata */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-1">
                        {activity.metadata.taskTitle && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Task:</span> {activity.metadata.taskTitle}
                          </p>
                        )}
                        {activity.metadata.projectName && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Project:</span> {activity.metadata.projectName}
                          </p>
                        )}
                        {activity.metadata.comment && (
                          <p className="text-sm text-gray-600 italic mt-1">
                            "{activity.metadata.comment.substring(0, 100)}{activity.metadata.comment.length > 100 ? '...' : ''}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Timestamp and Task */}
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                      {activity.task && (
                        <>
                          <span>•</span>
                          <span>{activity.task.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

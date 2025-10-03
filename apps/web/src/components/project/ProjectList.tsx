/**
 * Project List Component
 * Reference: Sprint 1 Planning - Task 2.4.6
 * Displays projects in grid/list with create button
 */

'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/stores/project.store';
import { useWorkspaceStore } from '@/stores/workspace.store';

interface ProjectListProps {
  onCreateClick: () => void;
}

export default function ProjectList({ onCreateClick }: ProjectListProps) {
  const { projects, isLoading, fetchWorkspaceProjects } = useProjectStore();
  const { currentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceProjects(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchWorkspaceProjects]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No projects</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first project.
        </p>
        <div className="mt-6">
          <button
            onClick={onCreateClick}
            className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-purple-700"
          >
            <svg
              className="-ml-0.5 mr-1.5 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Projects ({projects.length})
        </h2>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700"
        >
          <svg
            className="-ml-0.5 mr-1.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            {/* Project Icon */}
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-2xl text-white">
                {project.icon || '📁'}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="truncate font-semibold text-gray-900">
                  {project.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {project.visibility === 'PRIVATE' ? '🔒 Private' : '🌐 Public'}
                </p>
              </div>
            </div>

            {/* Project Description */}
            {project.description && (
              <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                {project.description}
              </p>
            )}

            {/* Project Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>{project.taskCount} tasks</span>
              </div>
              <button
                className="text-blue-600 opacity-0 transition-opacity hover:text-blue-700 group-hover:opacity-100"
                onClick={() => {
                  // Navigate to project details
                  window.location.href = `/projects/${project.id}`;
                }}
              >
                View →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

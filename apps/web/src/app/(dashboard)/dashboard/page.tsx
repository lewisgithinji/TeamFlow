'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace.store';
import ProjectList from '@/components/project/ProjectList';
import CreateProjectModal from '@/components/project/CreateProjectModal';
import { ActivityFeed } from '@/components/activity';

export default function DashboardPage() {
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  const { workspaces, currentWorkspace } = useWorkspaceStore();

  return (
    <>
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        workspaceId={currentWorkspace?.id || ''}
      />

      <div className="space-y-6">
          {/* Stats Cards */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Dashboard Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Projects</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {currentWorkspace?.projectCount || 0}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  {currentWorkspace?.projectCount === 1 ? 'Project' : 'Projects'} in workspace
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Members</h3>
                <p className="text-3xl font-bold text-green-600">
                  {currentWorkspace?.memberCount || 0}
                </p>
                <p className="text-sm text-green-700 mt-2">
                  {currentWorkspace?.memberCount === 1 ? 'Member' : 'Members'} in workspace
                </p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Workspaces</h3>
                <p className="text-3xl font-bold text-purple-600">{workspaces.length}</p>
                <p className="text-sm text-purple-700 mt-2">
                  {workspaces.length === 1 ? 'Workspace' : 'Workspaces'} available
                </p>
              </div>
            </div>

            {currentWorkspace && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Current Workspace
                </h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Name:</span> {currentWorkspace.name}
                  </p>
                  {currentWorkspace.description && (
                    <p>
                      <span className="font-medium">Description:</span>{' '}
                      {currentWorkspace.description}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Your Role:</span>{' '}
                    <span className="capitalize">{currentWorkspace.role.toLowerCase()}</span>
                  </p>
                  <p>
                    <span className="font-medium">Owner:</span> {currentWorkspace.owner.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Projects Section */}
          {currentWorkspace && (
            <div className="bg-white shadow rounded-lg p-6">
              <ProjectList onCreateClick={() => setIsCreateProjectModalOpen(true)} />
            </div>
          )}

        {/* Activity Feed Section */}
        {currentWorkspace && (
          <div className="bg-white shadow rounded-lg p-6">
            <ActivityFeed workspaceId={currentWorkspace.id} showFilters={true} />
          </div>
        )}
      </div>
    </>
  );
}

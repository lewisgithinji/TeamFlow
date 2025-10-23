'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace.store';
import ProjectList from '@/components/project/ProjectList';
import CreateProjectModal from '@/components/project/CreateProjectModal';

export default function ProjectsPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { currentWorkspace } = useWorkspaceStore();

  return (
    <>
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspaceId}
      />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <ProjectList onCreateClick={() => setIsCreateModalOpen(true)} />
        </div>
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, BoltIcon, PlayIcon, PauseIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface AutomationsPageProps {
  params: { workspaceId: string };
}

export default function AutomationsPage({ params }: AutomationsPageProps) {
  const { workspaceId } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch automation rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['automation-rules', workspaceId],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/automation/rules`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch automation rules');
      const data = await response.json();
      return data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/automation/rules/${ruleId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to delete automation rule');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Automation deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules', workspaceId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete automation');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ ruleId, rule }: { ruleId: string; rule: any }) => {
      const response = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/automation/rules/${ruleId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...rule,
            isActive: !rule.isActive,
          }),
        }
      );
      if (!response.ok) throw new Error('Failed to update automation rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', workspaceId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update automation');
    },
  });

  const handleCreateNew = () => {
    router.push(`/${workspaceId}/automations/new`);
  };

  const handleDelete = (e: React.MouseEvent, ruleId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this automation?')) {
      deleteMutation.mutate(ruleId);
    }
  };

  const handleToggleActive = (e: React.MouseEvent, ruleId: string, rule: any) => {
    e.stopPropagation();
    toggleActiveMutation.mutate({ ruleId, rule });
  };

  const handleEdit = (e: React.MouseEvent, ruleId: string) => {
    e.stopPropagation();
    router.push(`/${workspaceId}/automations/${ruleId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automations</h1>
              <p className="mt-2 text-gray-600">
                Create automated workflows to streamline your team's process
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Workflow
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!rulesData?.data || rulesData.data.length === 0) && (
          <div className="text-center py-12">
            <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No automations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first automated workflow.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Create Workflow
              </button>
            </div>
          </div>
        )}

        {/* Automation Rules List */}
        {rulesData?.data && rulesData.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rulesData.data.map((rule: any) => (
              <div
                key={rule.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow relative group"
              >
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleToggleActive(e, rule.id, rule)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.isActive
                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                    title={rule.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {rule.isActive ? (
                      <PauseIcon className="w-4 h-4" />
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => handleEdit(e, rule.id)}
                    className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, rule.id)}
                    className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <div
                  onClick={() => router.push(`/${workspaceId}/automations/${rule.id}`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-xs font-medium text-gray-500">
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{rule.name}</h3>
                {rule.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{rule.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Trigger:</span>
                    <span className="font-medium text-purple-600">{rule.triggerType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Actions:</span>
                    <span className="font-medium text-blue-600">{rule.actions?.length || 0}</span>
                  </div>
                  {rule._count && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Executions:</span>
                      <span className="font-medium text-gray-900">{rule._count.executions}</span>
                    </div>
                  )}
                </div>

                  {rule.creator && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Created by {rule.creator.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

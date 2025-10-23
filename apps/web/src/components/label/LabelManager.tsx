'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Label {
  id: string;
  name: string;
  color: string;
  _count?: {
    tasks: number;
  };
}

interface LabelManagerProps {
  workspaceId: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
  '#6366F1', // indigo
];

export function LabelManager({ workspaceId }: LabelManagerProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [newLabel, setNewLabel] = useState({ name: '', color: DEFAULT_COLORS[0] });

  // Fetch labels
  const { data: labels, isLoading } = useQuery<Label[]>({
    queryKey: ['labels', workspaceId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/labels`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch labels');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Create label mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/labels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create label');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', workspaceId] });
      setIsCreating(false);
      setNewLabel({ name: '', color: DEFAULT_COLORS[0] });
      toast.success('Label created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create label');
    },
  });

  // Update label mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      labelId,
      data,
    }: {
      labelId: string;
      data: { name?: string; color?: string };
    }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/labels/${labelId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update label');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', workspaceId] });
      setEditingLabel(null);
      toast.success('Label updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update label');
    },
  });

  // Delete label mutation
  const deleteMutation = useMutation({
    mutationFn: async (labelId: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/labels/${labelId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete label');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['labels', workspaceId] });
      toast.success(data.message || 'Label deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete label');
    },
  });

  const handleCreateLabel = () => {
    if (!newLabel.name.trim()) {
      toast.error('Label name is required');
      return;
    }
    createMutation.mutate(newLabel);
  };

  const handleUpdateLabel = (labelId: string, data: { name?: string; color?: string }) => {
    updateMutation.mutate({ labelId, data });
  };

  const handleDeleteLabel = (label: Label) => {
    const tasksCount = label._count?.tasks || 0;
    const confirmMessage =
      tasksCount > 0
        ? `This label is used by ${tasksCount} task(s). Are you sure you want to delete it?`
        : 'Are you sure you want to delete this label?';

    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate(label.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Labels</h3>
          <p className="text-sm text-gray-600 mt-1">
            Organize tasks with custom labels and colors
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Label
        </button>
      </div>

      {/* Create New Label Form */}
      {isCreating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Create New Label</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label Name
              </label>
              <input
                type="text"
                value={newLabel.name}
                onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                placeholder="e.g., Bug, Feature, Enhancement"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewLabel({ ...newLabel, color })}
                    className={`w-10 h-10 rounded-lg transition-transform ${
                      newLabel.color === color
                        ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewLabel({ name: '', color: DEFAULT_COLORS[0] });
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLabel}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Label'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Labels List */}
      <div className="space-y-2">
        {labels && labels.length > 0 ? (
          labels.map((label) => (
            <div
              key={label.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 transition-colors"
            >
              {editingLabel?.id === label.id ? (
                // Edit Mode
                <div className="flex-1 flex items-center gap-4">
                  <input
                    type="text"
                    value={editingLabel.name}
                    onChange={(e) =>
                      setEditingLabel({ ...editingLabel, name: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setEditingLabel({ ...editingLabel, color })
                        }
                        className={`w-8 h-8 rounded-lg transition-transform ${
                          editingLabel.color === color
                            ? 'ring-2 ring-offset-1 ring-gray-900 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingLabel(null)}
                      className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateLabel(label.id, {
                          name: editingLabel.name,
                          color: editingLabel.color,
                        })
                      }
                      disabled={updateMutation.isPending}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="font-medium text-gray-900">{label.name}</span>
                    {label._count && label._count.tasks > 0 && (
                      <span className="text-sm text-gray-500">
                        ({label._count.tasks} task{label._count.tasks !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingLabel(label)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit label"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLabel(label)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete label"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No labels yet</p>
            <p className="text-sm text-gray-500">
              Create labels to organize your tasks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

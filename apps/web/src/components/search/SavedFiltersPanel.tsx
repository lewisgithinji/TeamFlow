'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookmarkIcon, TrashIcon, PencilIcon, ShareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { SearchFilters } from './FilterPanel';
import { toast } from 'react-hot-toast';

interface SavedFiltersPanelProps {
  workspaceId: string;
  currentFilters?: SearchFilters;
  onFilterSelect: (filters: SearchFilters) => void;
}

interface SavedFilter {
  id: string;
  name: string;
  description: string | null;
  filters: SearchFilters;
  isPublic: boolean;
  createdBy: string;
  creator: {
    id: string;
    name: string;
    avatar: string | null;
  };
  createdAt: string;
}

export function SavedFiltersPanel({ workspaceId, currentFilters, onFilterSelect }: SavedFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch saved filters
  const { data: savedFilters, isLoading } = useQuery({
    queryKey: ['saved-filters', workspaceId],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:4000/api/search/filters/${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch saved filters');
      const data = await response.json();
      return data.data as SavedFilter[];
    },
  });

  // Create saved filter mutation
  const createFilterMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:4000/api/search/filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: filterName,
          description: filterDescription || undefined,
          workspaceId,
          filters: currentFilters,
          isPublic,
        }),
      });

      if (!response.ok) throw new Error('Failed to save filter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', workspaceId] });
      toast.success('Filter saved successfully!');
      setIsSaveModalOpen(false);
      setFilterName('');
      setFilterDescription('');
      setIsPublic(false);
    },
    onError: () => {
      toast.error('Failed to save filter');
    },
  });

  // Delete saved filter mutation
  const deleteFilterMutation = useMutation({
    mutationFn: async (filterId: string) => {
      const response = await fetch(`http://localhost:4000/api/search/filters/${filterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete filter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', workspaceId] });
      toast.success('Filter deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete filter');
    },
  });

  const handleSaveCurrentFilter = () => {
    if (!currentFilters || Object.keys(currentFilters).length === 0) {
      toast.error('No filters to save');
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleCopyFilterUrl = (filter: SavedFilter) => {
    const params = new URLSearchParams();
    const filters = filter.filters;

    if (filters.status) params.append('status', filters.status.join(','));
    if (filters.priority) params.append('priority', filters.priority.join(','));
    if (filters.assigneeId) params.append('assigneeId', filters.assigneeId.join(','));
    if (filters.labelId) params.append('labelId', filters.labelId.join(','));
    if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
    if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const url = `${window.location.origin}/${workspaceId}/search?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Filter URL copied to clipboard!');
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <BookmarkIcon className="h-4 w-4" />
        Saved Filters
        {savedFilters && savedFilters.length > 0 && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
            {savedFilters.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold">Saved Filters</h3>
            <button
              onClick={handleSaveCurrentFilter}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Save Current
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : savedFilters && savedFilters.length > 0 ? (
              <div className="space-y-2">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="group rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => {
                        onFilterSelect(filter.filters);
                        setIsOpen(false);
                      }}>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{filter.name}</h4>
                          {filter.isPublic && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Public
                            </span>
                          )}
                        </div>
                        {filter.description && (
                          <p className="text-sm text-gray-600 mb-2">{filter.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>By {filter.creator.name}</span>
                          <span>•</span>
                          <span>{new Date(filter.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyFilterUrl(filter)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Copy filter URL"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        {filter.createdBy === currentUser.id && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this filter?')) {
                                deleteFilterMutation.mutate(filter.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete filter"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                No saved filters yet. Create one by applying filters and clicking "Save Current".
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Filter Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Save Filter</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Name *
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., High Priority Tasks"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  placeholder="Describe what this filter is for..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  Make this filter public (visible to all workspace members)
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsSaveModalOpen(false);
                  setFilterName('');
                  setFilterDescription('');
                  setIsPublic(false);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createFilterMutation.mutate()}
                disabled={!filterName.trim() || createFilterMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createFilterMutation.isPending ? 'Saving...' : 'Save Filter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

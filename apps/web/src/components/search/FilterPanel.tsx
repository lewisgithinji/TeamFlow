'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterPanelProps {
  workspaceId: string;
  projectId?: string;
  onFilterChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export interface SearchFilters {
  status?: string[];
  priority?: string[];
  assigneeId?: string[];
  labelId?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  createdBy?: string;
  sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'DONE', label: 'Done', color: 'bg-green-100 text-green-800' },
  { value: 'BLOCKED', label: 'Blocked', color: 'bg-red-100 text-red-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-100 text-gray-600' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
];

export function FilterPanel({ workspaceId, projectId, onFilterChange, initialFilters = {} }: FilterPanelProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch workspace members for assignee filter
  const { data: members } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      return data.data;
    },
  });

  // Fetch labels
  const { data: labels } = useQuery({
    queryKey: ['workspace-labels', workspaceId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/labels`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch labels');
      const data = await response.json();
      return data.data;
    },
  });

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => {
      const currentArray = (prev[key] as string[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];

      return { ...prev, [key]: newArray.length > 0 ? newArray : undefined };
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof SearchFilters] !== undefined &&
             (Array.isArray(filters[key as keyof SearchFilters])
              ? (filters[key as keyof SearchFilters] as any[]).length > 0
              : true)
  ).length;

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
          activeFilterCount > 0
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <FunnelIcon className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[600px] overflow-y-auto p-4 space-y-6">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleArrayFilter('status', option.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      filters.status?.includes(option.value)
                        ? option.color + ' ring-2 ring-offset-1 ring-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleArrayFilter('priority', option.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      filters.priority?.includes(option.value)
                        ? option.color + ' ring-2 ring-offset-1 ring-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee Filter */}
            {members && members.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Assignee</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members.map((member: any) => (
                    <label
                      key={member.userId}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded p-2"
                    >
                      <input
                        type="checkbox"
                        checked={filters.assigneeId?.includes(member.userId) || false}
                        onChange={() => toggleArrayFilter('assigneeId', member.userId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.name}
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                            {member.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm">{member.user.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Label Filter */}
            {labels && labels.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label: any) => (
                    <button
                      key={label.id}
                      onClick={() => toggleArrayFilter('labelId', label.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        filters.labelId?.includes(label.id)
                          ? 'ring-2 ring-offset-1 ring-blue-500'
                          : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: label.color,
                        color: '#ffffff',
                      }}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Due Date Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">From</label>
                  <input
                    type="date"
                    value={filters.dueDateFrom || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dueDateFrom: e.target.value || undefined,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">To</label>
                  <input
                    type="date"
                    value={filters.dueDateTo || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dueDateTo: e.target.value || undefined,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as any,
                    }))
                  }
                  className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortOrder: e.target.value as any,
                    }))
                  }
                  className="block w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 p-4">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear all
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

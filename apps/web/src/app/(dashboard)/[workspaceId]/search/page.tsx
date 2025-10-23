'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { GlobalSearchBar, FilterPanel, SearchFilters } from '@/components/search';
import { SavedFiltersPanel } from '@/components/search/SavedFiltersPanel';
import { TaskCard } from '@/components/kanban/TaskCard';

interface SearchPageProps {
  params: { workspaceId: string };
}

export default function SearchPage({ params }: SearchPageProps) {
  const { workspaceId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({});

  // Parse URL parameters into filters
  useEffect(() => {
    const urlFilters: SearchFilters = {};

    if (searchParams.get('status')) {
      urlFilters.status = searchParams.get('status')!.split(',');
    }
    if (searchParams.get('priority')) {
      urlFilters.priority = searchParams.get('priority')!.split(',');
    }
    if (searchParams.get('assigneeId')) {
      urlFilters.assigneeId = searchParams.get('assigneeId')!.split(',');
    }
    if (searchParams.get('labelId')) {
      urlFilters.labelId = searchParams.get('labelId')!.split(',');
    }
    if (searchParams.get('dueDateFrom')) {
      urlFilters.dueDateFrom = searchParams.get('dueDateFrom')!;
    }
    if (searchParams.get('dueDateTo')) {
      urlFilters.dueDateTo = searchParams.get('dueDateTo')!;
    }
    if (searchParams.get('sortBy')) {
      urlFilters.sortBy = searchParams.get('sortBy') as any;
    }
    if (searchParams.get('sortOrder')) {
      urlFilters.sortOrder = searchParams.get('sortOrder') as any;
    }

    setFilters(urlFilters);
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Build query params for API
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    if (query) params.append('q', query);
    params.append('workspaceId', workspaceId);

    if (filters.status) params.append('status', filters.status.join(','));
    if (filters.priority) params.append('priority', filters.priority.join(','));
    if (filters.assigneeId) params.append('assigneeId', filters.assigneeId.join(','));
    if (filters.labelId) params.append('labelId', filters.labelId.join(','));
    if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
    if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return params.toString();
  }, [query, workspaceId, filters]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (query) params.append('q', query);
    if (filters.status) params.append('status', filters.status.join(','));
    if (filters.priority) params.append('priority', filters.priority.join(','));
    if (filters.assigneeId) params.append('assigneeId', filters.assigneeId.join(','));
    if (filters.labelId) params.append('labelId', filters.labelId.join(','));
    if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
    if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const newUrl = `/${workspaceId}/search${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [query, filters, workspaceId, router]);

  // Fetch search results
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search-results', workspaceId, query, filters],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const queryParams = buildQueryParams();

      const response = await fetch(
        `http://localhost:4000/api/search/tasks?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return data.data;
    },
    enabled: query.length >= 2 || Object.keys(filters).length > 0,
  });

  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Tasks</h1>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <GlobalSearchBar workspaceId={workspaceId} />
            </div>
            <SavedFiltersPanel
              workspaceId={workspaceId}
              currentFilters={filters}
              onFilterSelect={handleFilterChange}
            />
            <FilterPanel
              workspaceId={workspaceId}
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
            Failed to load search results. Please try again.
          </div>
        ) : searchResults && searchResults.tasks.length > 0 ? (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              Found {searchResults.total} result{searchResults.total !== 1 ? 's' : ''}
              {query && ` for "${query}"`}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.tasks.map((task: any) => (
                <div key={task.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      task.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>

                    {task.projectName && (
                      <span className="text-xs text-gray-500">{task.projectName}</span>
                    )}
                  </div>

                  {task.labels && task.labels.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {task.labels.map((label: any) => (
                        <span
                          key={label.id}
                          className="rounded-full px-2 py-1 text-xs"
                          style={{
                            backgroundColor: label.color,
                            color: '#ffffff',
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {task.assignees && task.assignees.length > 0 && (
                    <div className="mt-3 flex -space-x-2">
                      {task.assignees.slice(0, 3).map((assignee: any) => (
                        <div
                          key={assignee.id}
                          className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs ring-2 ring-white"
                          title={assignee.name}
                        >
                          {assignee.avatar ? (
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="h-6 w-6 rounded-full"
                            />
                          ) : (
                            assignee.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs ring-2 ring-white">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {task.relevance !== undefined && (
                    <div className="mt-3 text-xs text-gray-500">
                      Relevance: {(task.relevance * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {searchResults.hasMore && (
              <div className="mt-6 text-center">
                <button className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                  Load More
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center">
            <p className="text-gray-600">
              {query || Object.keys(filters).length > 0
                ? 'No tasks found matching your search criteria.'
                : 'Start typing to search for tasks or use filters to narrow down results.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

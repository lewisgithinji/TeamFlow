'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchSuggestion {
  id: string;
  title: string;
  projectName: string;
}

interface GlobalSearchBarProps {
  workspaceId: string;
  onSearchClick?: () => void;
}

export function GlobalSearchBar({ workspaceId, onSearchClick }: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Fetch suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', workspaceId, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}&workspaceId=${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      return data.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      router.push(`/${workspaceId}/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      onSearchClick?.();
    }
  }, [query, workspaceId, router, onSearchClick]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>

        <input
          type="text"
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Search tasks, projects, or use filters..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {query && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {isOpen && (query.length >= 2 || suggestions) && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions && suggestions.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto py-2">
              {suggestions.map((suggestion: string, index: number) => (
                <li
                  key={index}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch();
                  }}
                >
                  <div className="flex items-center">
                    <MagnifyingGlassIcon className="mr-2 h-4 w-4 text-gray-400" />
                    <span
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: suggestion }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : debouncedQuery.length >= 2 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No suggestions found
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Type at least 2 characters to search
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
            <button
              onClick={handleSearch}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Press Enter or click to search all results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Workspace Switcher Component
 * Reference: Sprint 1 Planning - Task 2.1.6
 * Dropdown to switch between user workspaces
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace.store';

interface WorkspaceSwitcherProps {
  onCreateNew: () => void;
}

export default function WorkspaceSwitcher({ onCreateNew }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaceStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (workspaceId: string) => {
    switchWorkspace(workspaceId);
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Workspace Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {currentWorkspace ? (
          <>
            {/* Logo or Initials */}
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-r from-blue-600 to-purple-600 text-xs font-semibold text-white">
              {currentWorkspace.logo ? (
                <img
                  src={currentWorkspace.logo}
                  alt={currentWorkspace.name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                getInitials(currentWorkspace.name)
              )}
            </div>

            {/* Workspace Name */}
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-900">{currentWorkspace.name}</span>
              <span className="text-xs text-gray-500 capitalize">{currentWorkspace.role.toLowerCase()}</span>
            </div>

            {/* Dropdown Icon */}
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        ) : (
          <span className="text-gray-500">No Workspace</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Workspaces List */}
          <div className="max-h-64 overflow-y-auto p-2">
            {workspaces.length > 0 ? (
              workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSwitch(workspace.id)}
                  className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left transition-colors ${
                    currentWorkspace?.id === workspace.id
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {/* Logo or Initials */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded text-xs font-semibold text-white ${
                      currentWorkspace?.id === workspace.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600'
                    }`}
                  >
                    {workspace.logo ? (
                      <img
                        src={workspace.logo}
                        alt={workspace.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      getInitials(workspace.name)
                    )}
                  </div>

                  {/* Workspace Info */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{workspace.name}</span>
                      {currentWorkspace?.id === workspace.id && (
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="capitalize">{workspace.role.toLowerCase()}</span>
                      <span>•</span>
                      <span>{workspace.memberCount} members</span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                No workspaces found
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Create New Workspace */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateNew();
              }}
              className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create New Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace.store';
import WorkspaceSwitcher from '@/components/workspace/WorkspaceSwitcher';
import { NotificationDropdown } from '@/components/notifications';
import { GlobalSearchBar } from '@/components/search';

interface TopNavProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  onCreateWorkspace: () => void;
}

export function TopNav({ user, onCreateWorkspace }: TopNavProps) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 gap-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TeamFlow
            </h1>
            <WorkspaceSwitcher onCreateNew={onCreateWorkspace} />
          </div>

          {/* Search Bar - only show if workspace is selected */}
          {currentWorkspace && (
            <div className="flex-1 flex items-center max-w-2xl">
              <GlobalSearchBar workspaceId={currentWorkspace.id} />
            </div>
          )}

          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-gray-700">
                Welcome, {user.name}
              </span>
            )}
            <NotificationDropdown />
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

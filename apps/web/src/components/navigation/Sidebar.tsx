'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace.store';
import {
  HomeIcon,
  FolderIcon,
  CheckSquareIcon,
  ZapIcon,
  BarChart3Icon,
  SettingsIcon,
  ActivityIcon,
  UsersIcon,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspaceStore();

  if (!currentWorkspace) return null;

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Projects', href: `/${currentWorkspace.id}/projects`, icon: FolderIcon },
    { name: 'Tasks', href: `/${currentWorkspace.id}/tasks`, icon: CheckSquareIcon },
    { name: 'Team', href: `/${currentWorkspace.id}/team`, icon: UsersIcon },
    { name: 'Activity', href: `/${currentWorkspace.id}/activity`, icon: ActivityIcon },
    { name: 'Automations', href: `/${currentWorkspace.id}/automations`, icon: ZapIcon },
    { name: 'Analytics', href: `/${currentWorkspace.id}/analytics`, icon: BarChart3Icon },
    { name: 'Settings', href: `/${currentWorkspace.id}/settings`, icon: SettingsIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg
                transition-colors duration-150
                ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`mr-3 h-5 w-5 ${active ? 'text-blue-700' : 'text-gray-400'}`} />
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Workspace Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-1">Current Workspace</div>
        <div className="text-sm font-medium text-gray-900 truncate">
          {currentWorkspace.name}
        </div>
        <div className="text-xs text-gray-500 mt-1 capitalize">
          {currentWorkspace.role.toLowerCase()}
        </div>
      </div>
    </div>
  );
}

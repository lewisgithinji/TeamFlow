'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';
import CreateWorkspaceModal from '@/components/workspace/CreateWorkspaceModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { fetchWorkspaces } = useWorkspaceStore();

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch current user
    fetch('http://localhost:4000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        setUser(data.data);
        setIsLoading(false);
        // Fetch workspaces after user is loaded
        fetchWorkspaces();
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      });
  }, [router, fetchWorkspaces, isMounted]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceModalOpen}
        onClose={() => setIsCreateWorkspaceModalOpen(false)}
      />

      <TopNav
        user={user}
        onCreateWorkspace={() => setIsCreateWorkspaceModalOpen(true)}
      />

      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

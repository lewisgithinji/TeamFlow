'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InviteUserDialog } from '@/components/invitation/InviteUserDialog';

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  accepted: boolean;
  createdAt: string;
  expiresAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user's workspaces from localStorage or API
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // For now, get workspaces from API
        fetchWorkspaces();
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/workspaces', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setWorkspaces(result.data || []);
        if (result.data && result.data.length > 0) {
          setSelectedWorkspace(result.data[0].id);
          fetchInvitations(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvitations = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/invitations?workspaceId=${workspaceId}`);
      if (response.ok) {
        const result = await response.json();
        setInvitations(result.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId);
    fetchInvitations(workspaceId);
  };

  const handleInviteSuccess = () => {
    if (selectedWorkspace) {
      fetchInvitations(selectedWorkspace);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invitations/${invitationId}/revoke`, {
        method: 'POST',
      });

      if (response.ok) {
        if (selectedWorkspace) {
          fetchInvitations(selectedWorkspace);
        }
      } else {
        alert('Failed to revoke invitation');
      }
    } catch (error) {
      console.error('Error revoking invitation:', error);
      alert('Failed to revoke invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Invitation resent successfully!');
      } else {
        alert('Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Workspace Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Workspace
            </label>
            <select
              value={selectedWorkspace}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
              className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team Members Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Invite team members to collaborate on this workspace
                </p>
              </div>
              <button
                onClick={() => setIsInviteDialogOpen(true)}
                disabled={!selectedWorkspace}
                className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                <svg
                  className="-ml-0.5 mr-1.5 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Invite Member
              </button>
            </div>

            {/* Pending Invitations */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pending Invitations ({invitations.filter((i) => !i.accepted).length})
              </h3>

              {invitations.filter((i) => !i.accepted).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending invitations
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations
                    .filter((i) => !i.accepted)
                    .map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {invitation.role}
                            </span>
                            <span className="text-xs text-gray-500">
                              Sent {new Date(invitation.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => handleRevokeInvitation(invitation.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Invite Dialog */}
      {isInviteDialogOpen && selectedWorkspace && (
        <InviteUserDialog
          workspaceId={selectedWorkspace}
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
}

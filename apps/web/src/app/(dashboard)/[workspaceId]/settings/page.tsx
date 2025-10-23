'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { InviteUserDialog } from '@/components/invitation/InviteUserDialog';
import { LabelManager } from '@/components/label';

interface Invitation {
  id: string;
  email: string;
  role: string;
  accepted: boolean;
  createdAt: string;
  expiresAt: string;
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [activeTab, setActiveTab] = useState<'integrations' | 'team' | 'labels'>('integrations');

  useEffect(() => {
    if (workspaceId) {
      fetchInvitations();
    }
  }, [workspaceId]);

  const fetchInvitations = async () => {
    try {
      setIsLoadingInvitations(true);
      const response = await fetch(`/api/invitations?workspaceId=${workspaceId}`);
      if (response.ok) {
        const result = await response.json();
        setInvitations(result.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleInviteSuccess = () => {
    fetchInvitations();
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
        fetchInvitations();
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

  const integrations = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get real-time notifications in Slack for task updates, assignments, and mentions',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500',
      href: `/${workspaceId}/settings/integrations/slack`,
      badge: 'Popular',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push(`/${workspaceId}/dashboard`)}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to workspace
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
          <p className="text-gray-600 mt-2">Manage your workspace integrations, team members, and preferences</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('integrations')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'integrations'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                Integrations
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'team'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Team Members
              </button>
              <button
                onClick={() => setActiveTab('labels')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'labels'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Labels
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Integrations Section */}
            {activeTab === 'integrations' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Integrations</h2>
                <p className="text-gray-600 mb-6">
                  Connect TeamFlow with your favorite tools to streamline your workflow
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {integrations.map((integration) => (
                    <Link
                      key={integration.id}
                      href={integration.href}
                      className="block group"
                    >
                      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-6 h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${integration.gradient} text-white`}>
                            {integration.icon}
                          </div>
                          {integration.badge && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {integration.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {integration.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {integration.description}
                        </p>
                        <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                          Configure
                          <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Coming Soon */}
                <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">More integrations coming soon</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    We're working on adding more integrations. Let us know which tools you'd like to see!
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <span className="font-medium">GitHub</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                        <span className="font-bold text-gray-600">J</span>
                      </div>
                      <span className="font-medium">Jira</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                        <span className="font-bold text-gray-600">MS</span>
                      </div>
                      <span className="font-medium">Microsoft Teams</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Labels Section */}
            {activeTab === 'labels' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <LabelManager workspaceId={workspaceId} />
              </div>
            )}

            {/* Team Members Section */}
            {activeTab === 'team' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Invite team members to collaborate on this workspace
                    </p>
                  </div>
                  <button
                    onClick={() => setIsInviteDialogOpen(true)}
                    className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700"
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
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Pending Invitations ({invitations.filter((i) => !i.accepted).length})
                  </h3>

                  {isLoadingInvitations ? (
                    <div className="text-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                      <p className="text-gray-600 mt-2 text-sm">Loading invitations...</p>
                    </div>
                  ) : invitations.filter((i) => !i.accepted).length === 0 ? (
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
            )}
          </div>
        </div>
      </main>

      {/* Invite Dialog */}
      {isInviteDialogOpen && (
        <InviteUserDialog
          workspaceId={workspaceId}
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
}

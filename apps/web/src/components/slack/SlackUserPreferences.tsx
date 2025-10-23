'use client';

import { useState, useEffect } from 'react';

interface UserPreferences {
  id: string;
  userId: string;
  integrationId: string;
  slackUserId?: string;
  slackUserName?: string;
  enableDMs: boolean;
  frequency: 'instant' | 'hourly' | 'daily' | 'disabled';
  notifyOnAssignment: boolean;
  notifyOnMention: boolean;
  notifyOnStatusChange: boolean;
  notifyOnComment: boolean;
  notifyOnDueDate: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface SlackUserPreferencesProps {
  integrationId: string;
}

export function SlackUserPreferences({ integrationId }: SlackUserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [integrationId]);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/slack/integration/${integrationId}/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/slack/integration/${integrationId}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const result = await response.json();
        setPreferences(result.data);
      } else {
        alert('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-2 text-sm">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center">Unable to load preferences</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Your Notification Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">
          Customize how and when you receive Slack notifications
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Slack User Info */}
        {preferences.slackUserId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-900">
                  Connected as @{preferences.slackUserName}
                </p>
                <p className="text-sm text-green-700 mt-0.5">
                  Your TeamFlow account is linked to your Slack account
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enable DMs */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">Enable Direct Messages</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Receive notifications via Slack DMs
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enableDMs}
              onChange={(e) => updatePreferences({ enableDMs: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Notification Frequency */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Notification Frequency</h3>
          <select
            value={preferences.frequency}
            onChange={(e) => updatePreferences({ frequency: e.target.value as any })}
            disabled={!preferences.enableDMs}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="instant">Instant - Receive notifications immediately</option>
            <option value="hourly">Hourly - Digest every hour</option>
            <option value="daily">Daily - Daily summary</option>
            <option value="disabled">Disabled - No notifications</option>
          </select>
        </div>

        {/* Event Types */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Notify me about</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyOnAssignment}
                onChange={(e) => updatePreferences({ notifyOnAssignment: e.target.checked })}
                disabled={!preferences.enableDMs}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Task assignments</span>
                <p className="text-sm text-gray-500">When I'm assigned to a task</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyOnMention}
                onChange={(e) => updatePreferences({ notifyOnMention: e.target.checked })}
                disabled={!preferences.enableDMs}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Mentions</span>
                <p className="text-sm text-gray-500">When someone @mentions me</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyOnStatusChange}
                onChange={(e) => updatePreferences({ notifyOnStatusChange: e.target.checked })}
                disabled={!preferences.enableDMs}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Status changes</span>
                <p className="text-sm text-gray-500">When task status changes</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyOnComment}
                onChange={(e) => updatePreferences({ notifyOnComment: e.target.checked })}
                disabled={!preferences.enableDMs}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Comments</span>
                <p className="text-sm text-gray-500">When someone comments on my tasks</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyOnDueDate}
                onChange={(e) => updatePreferences({ notifyOnDueDate: e.target.checked })}
                disabled={!preferences.enableDMs}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Due date reminders</span>
                <p className="text-sm text-gray-500">Reminders for upcoming deadlines</p>
              </div>
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Quiet Hours</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Pause notifications during specific hours
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.quietHoursEnabled}
                onChange={(e) => updatePreferences({ quietHoursEnabled: e.target.checked })}
                disabled={!preferences.enableDMs}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start time
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursStart || '22:00'}
                  onChange={(e) => updatePreferences({ quietHoursStart: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End time
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursEnd || '08:00'}
                  onChange={(e) => updatePreferences({ quietHoursEnd: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save indicator */}
        {isSaving && (
          <div className="flex items-center justify-center py-2 text-sm text-gray-600">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}

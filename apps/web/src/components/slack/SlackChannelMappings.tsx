'use client';

import { useState, useEffect } from 'react';

interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  numMembers?: number;
}

interface ChannelMapping {
  id: string;
  integrationId: string;
  projectId?: string;
  channelId: string;
  channelName: string;
  channelType: string;
  notifyOnAssignment: boolean;
  notifyOnStatusChange: boolean;
  notifyOnComment: boolean;
  notifyOnDueDate: boolean;
}

interface SlackChannelMappingsProps {
  integrationId: string;
}

export function SlackChannelMappings({ integrationId }: SlackChannelMappingsProps) {
  const [mappings, setMappings] = useState<ChannelMapping[]>([]);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMapping, setIsAddingMapping] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('');

  useEffect(() => {
    fetchMappings();
    fetchChannels();
  }, [integrationId]);

  const fetchMappings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/slack/integration/${integrationId}/channels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setMappings(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching channel mappings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/slack/integration/${integrationId}/channels/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setChannels(result.data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching Slack channels:', error);
    }
  };

  const handleAddMapping = async () => {
    if (!selectedChannel) return;

    const channel = channels.find(c => c.id === selectedChannel);
    if (!channel) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/slack/integration/${integrationId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelId: channel.id,
          channelName: channel.name,
          channelType: channel.isPrivate ? 'private' : 'public',
          notifyOnAssignment: true,
          notifyOnStatusChange: true,
          notifyOnComment: true,
          notifyOnDueDate: true,
        }),
      });

      if (response.ok) {
        await fetchMappings();
        setSelectedChannel('');
        setIsAddingMapping(false);
      } else {
        alert('Failed to add channel mapping');
      }
    } catch (error) {
      console.error('Error adding channel mapping:', error);
      alert('Failed to add channel mapping');
    }
  };

  const handleRemoveMapping = async (mappingId: string) => {
    if (!confirm('Are you sure you want to remove this channel mapping?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/slack/channels/${mappingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchMappings();
      } else {
        alert('Failed to remove channel mapping');
      }
    } catch (error) {
      console.error('Error removing channel mapping:', error);
      alert('Failed to remove channel mapping');
    }
  };

  const handleToggleNotification = async (mappingId: string, field: string, value: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/slack/channels/${mappingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [field]: value,
        }),
      });

      if (response.ok) {
        await fetchMappings();
      } else {
        alert('Failed to update notification setting');
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
      alert('Failed to update notification setting');
    }
  };

  // Filter out already mapped channels
  const availableChannels = channels.filter(
    channel => !mappings.find(m => m.channelId === channel.id)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Channel Mappings</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure which Slack channels receive notifications
            </p>
          </div>
          <button
            onClick={() => setIsAddingMapping(!isAddingMapping)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Channel
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Add Channel Form */}
        {isAddingMapping && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Add Channel Mapping</h3>
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Channel
                </label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a channel...</option>
                  {availableChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.isPrivate ? '🔒' : '#'} {channel.name}
                      {channel.numMembers ? ` (${channel.numMembers} members)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddMapping}
                disabled={!selectedChannel}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setIsAddingMapping(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mappings List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-2 text-sm">Loading channel mappings...</p>
          </div>
        ) : mappings.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-gray-600">No channel mappings configured</p>
            <p className="text-sm text-gray-500 mt-1">Add a channel to start receiving notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mappings.map((mapping) => (
              <div
                key={mapping.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {mapping.channelType === 'private' ? '🔒' : '#'}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{mapping.channelName}</h4>
                      <p className="text-sm text-gray-500">
                        {mapping.channelType === 'private' ? 'Private' : 'Public'} channel
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMapping(mapping.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>

                {/* Notification Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapping.notifyOnAssignment}
                      onChange={(e) => handleToggleNotification(mapping.id, 'notifyOnAssignment', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Task assignments</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapping.notifyOnStatusChange}
                      onChange={(e) => handleToggleNotification(mapping.id, 'notifyOnStatusChange', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Status changes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapping.notifyOnComment}
                      onChange={(e) => handleToggleNotification(mapping.id, 'notifyOnComment', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Comments</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapping.notifyOnDueDate}
                      onChange={(e) => handleToggleNotification(mapping.id, 'notifyOnDueDate', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Due date reminders</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

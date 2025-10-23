'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ACTION_TYPES, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, HTTP_METHODS } from '@/lib/automation/constants';
import { ActionConfig, AutomationActionType } from '@/lib/automation/types';

interface ActionConfigPanelProps {
  workspaceId: string;
  actionType: AutomationActionType;
  config: ActionConfig;
  onSave: (config: ActionConfig) => void;
  onClose: () => void;
}

export function ActionConfigPanel({ workspaceId, actionType, config, onSave, onClose }: ActionConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<ActionConfig>(config);
  const actionInfo = ACTION_TYPES[actionType];

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch workspace members
  const { data: members } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.warn('Members endpoint not found, using empty array');
        return [];
      }
      const data = await response.json();
      return data.data;
    },
    enabled: actionType === 'ASSIGN_USER',
    retry: false, // Don't retry on 404
  });

  // Fetch workspace labels
  const { data: labels } = useQuery({
    queryKey: ['workspace-labels', workspaceId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/labels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.warn('Labels endpoint not found, using empty array');
        return [];
      }
      const data = await response.json();
      return data.data;
    },
    enabled: actionType === 'ADD_LABEL' || actionType === 'REMOVE_LABEL',
    retry: false, // Don't retry on 404
  });

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Action</h3>
          <p className="text-sm text-gray-600 mt-1">
            {actionInfo?.icon} {actionInfo?.label}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">{actionInfo?.description}</p>
        </div>

        {/* UPDATE_STATUS */}
        {actionType === 'UPDATE_STATUS' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Status *</label>
            <select
              value={localConfig.status || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, status: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select status</option>
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* UPDATE_PRIORITY */}
        {actionType === 'UPDATE_PRIORITY' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Priority *</label>
            <select
              value={localConfig.priority || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, priority: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select priority</option>
              {TASK_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ASSIGN_USER */}
        {actionType === 'ASSIGN_USER' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
            <select
              value={localConfig.userId || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, userId: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select user</option>
              {members?.map((member: any) => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name} ({member.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ADD_LABEL / REMOVE_LABEL */}
        {(actionType === 'ADD_LABEL' || actionType === 'REMOVE_LABEL') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Label *</label>
            <select
              value={localConfig.labelId || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, labelId: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select label</option>
              {labels?.map((label: any) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ADD_COMMENT */}
        {actionType === 'ADD_COMMENT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment Text *</label>
            <textarea
              value={localConfig.comment || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, comment: e.target.value })}
              placeholder="Enter comment text..."
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            <p className="mt-2 text-sm text-gray-500">This comment will be added to the task</p>
          </div>
        )}

        {/* SEND_NOTIFICATION */}
        {actionType === 'SEND_NOTIFICATION' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title *</label>
              <input
                type="text"
                value={localConfig.title || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                placeholder="e.g., Task Updated"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
              <textarea
                value={localConfig.message || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, message: e.target.value })}
                placeholder="Enter notification message..."
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </>
        )}

        {/* SEND_EMAIL */}
        {actionType === 'SEND_EMAIL' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Email *</label>
              <input
                type="email"
                value={localConfig.to || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, to: e.target.value })}
                placeholder="recipient@example.com"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
              <input
                type="text"
                value={localConfig.subject || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, subject: e.target.value })}
                placeholder="Email subject"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Body *</label>
              <textarea
                value={localConfig.body || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, body: e.target.value })}
                placeholder="Email body..."
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </>
        )}

        {/* WEBHOOK_CALL */}
        {actionType === 'WEBHOOK_CALL' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL *</label>
              <input
                type="url"
                value={localConfig.url || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                placeholder="https://example.com/webhook"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method *</label>
              <select
                value={localConfig.method || 'POST'}
                onChange={(e) => setLocalConfig({ ...localConfig, method: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                {HTTP_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* UNASSIGN_USER, MOVE_TO_SPRINT - Simple actions */}
        {['UNASSIGN_USER', 'MOVE_TO_SPRINT'].includes(actionType) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              {actionType === 'UNASSIGN_USER' && 'This action will remove all assignees from the task.'}
              {actionType === 'MOVE_TO_SPRINT' && 'Sprint selection will be added in a future update.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}

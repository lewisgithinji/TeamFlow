'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TRIGGER_TYPES, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, DUE_DATE_HOURS } from '@/lib/automation/constants';
import { TriggerConfig, AutomationTriggerType } from '@/lib/automation/types';

interface TriggerConfigPanelProps {
  workspaceId: string;
  triggerType: AutomationTriggerType;
  config: TriggerConfig;
  onSave: (config: TriggerConfig) => void;
  onClose: () => void;
}

export function TriggerConfigPanel({ workspaceId, triggerType, config, onSave, onClose }: TriggerConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<TriggerConfig>(config);
  const triggerInfo = TRIGGER_TYPES[triggerType];

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch workspace labels for label triggers
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
    enabled: triggerType === 'LABEL_ADDED' || triggerType === 'LABEL_REMOVED',
    retry: false,
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
          <h3 className="text-lg font-semibold text-gray-900">Configure Trigger</h3>
          <p className="text-sm text-gray-600 mt-1">
            {triggerInfo?.icon} {triggerInfo?.label}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">{triggerInfo?.description}</p>
        </div>

        {/* Status Changed Config */}
        {triggerType === 'TASK_STATUS_CHANGED' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Status (Optional)
              </label>
              <select
                value={localConfig.fromStatus || ''}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, fromStatus: e.target.value || undefined })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="">Any status</option>
                {TASK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Status *
              </label>
              <select
                value={localConfig.toStatus || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, toStatus: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
          </>
        )}

        {/* Priority Changed Config */}
        {triggerType === 'PRIORITY_CHANGED' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Priority (Optional)
              </label>
              <select
                value={localConfig.fromPriority || ''}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, fromPriority: e.target.value || undefined })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="">Any priority</option>
                {TASK_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Priority *
              </label>
              <select
                value={localConfig.toPriority || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, toPriority: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
          </>
        )}

        {/* Due Date Approaching Config */}
        {triggerType === 'DUE_DATE_APPROACHING' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours Before Due Date *
            </label>
            <select
              value={localConfig.hoursBeforeDue || 24}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, hoursBeforeDue: parseInt(e.target.value) })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              required
            >
              {DUE_DATE_HOURS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Trigger will fire this many hours before the task is due
            </p>
          </div>
        )}

        {/* Label Added/Removed Config */}
        {(triggerType === 'LABEL_ADDED' || triggerType === 'LABEL_REMOVED') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Label (Optional)
            </label>
            <select
              value={localConfig.labelId || ''}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, labelId: e.target.value || undefined })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="">Any label</option>
              {labels?.map((label: any) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Leave as "Any label" to trigger on any label change, or select a specific label
            </p>
          </div>
        )}

        {/* Simple triggers (no config needed) */}
        {['TASK_CREATED', 'TASK_ASSIGNED', 'TASK_UNASSIGNED', 'DUE_DATE_PASSED', 'COMMENT_ADDED'].includes(triggerType) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              This trigger doesn't require additional configuration. It will fire whenever the event occurs.
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
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}

'use client';

import { TriggerType, type TriggerConfig } from '@/types/automation';

interface TriggerConfigBuilderProps {
  triggerType: TriggerType;
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
}

const TRIGGER_METADATA = {
  [TriggerType.STATUS_CHANGED]: {
    label: 'Status Changed',
    description: 'Trigger when a task status changes',
  },
  [TriggerType.ASSIGNEE_CHANGED]: {
    label: 'Assignee Changed',
    description: 'Trigger when a task is assigned to someone',
  },
  [TriggerType.PRIORITY_CHANGED]: {
    label: 'Priority Changed',
    description: 'Trigger when task priority changes',
  },
  [TriggerType.DUE_DATE_APPROACHING]: {
    label: 'Due Date Approaching',
    description: 'Trigger before a task due date',
  },
  [TriggerType.TASK_CREATED]: {
    label: 'Task Created',
    description: 'Trigger when a new task is created',
  },
  [TriggerType.COMMENT_ADDED]: {
    label: 'Comment Added',
    description: 'Trigger when a comment is added',
  },
};

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
  { value: 'BLOCKED', label: 'Blocked' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export default function TriggerConfigBuilder({
  triggerType,
  config,
  onChange,
}: TriggerConfigBuilderProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const renderConfigFields = () => {
    switch (triggerType) {
      case TriggerType.STATUS_CHANGED:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Status (optional)
              </label>
              <select
                value={(config as any).fromStatus || ''}
                onChange={(e) => updateConfig('fromStatus', e.target.value || undefined)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Status</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to match any status
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Status (optional)
              </label>
              <select
                value={(config as any).toStatus || ''}
                onChange={(e) => updateConfig('toStatus', e.target.value || undefined)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Status</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to match any status
              </p>
            </div>
          </div>
        );

      case TriggerType.ASSIGNEE_CHANGED:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From User ID (optional)
              </label>
              <input
                type="text"
                value={(config as any).fromUserId || ''}
                onChange={(e) => updateConfig('fromUserId', e.target.value || undefined)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for any user"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To User ID (optional)
              </label>
              <input
                type="text"
                value={(config as any).toUserId || ''}
                onChange={(e) => updateConfig('toUserId', e.target.value || undefined)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for any user"
              />
            </div>
          </div>
        );

      case TriggerType.PRIORITY_CHANGED:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Priority (optional)
              </label>
              <select
                value={(config as any).fromPriority || ''}
                onChange={(e) => updateConfig('fromPriority', e.target.value || undefined)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Priority</option>
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Priority (optional)
              </label>
              <select
                value={(config as any).toPriority || ''}
                onChange={(e) => updateConfig('toPriority', e.target.value || undefined)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Priority</option>
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case TriggerType.DUE_DATE_APPROACHING:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Before Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={(config as any).daysBeforeDue || ''}
              onChange={(e) => updateConfig('daysBeforeDue', parseInt(e.target.value) || 1)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Trigger this many days before the task is due
            </p>
          </div>
        );

      case TriggerType.TASK_CREATED:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project ID (optional)
            </label>
            <input
              type="text"
              value={(config as any).projectId || ''}
              onChange={(e) => updateConfig('projectId', e.target.value || undefined)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty to trigger for all projects"
            />
            <p className="mt-1 text-xs text-gray-500">
              Specify a project ID to only trigger for tasks in that project
            </p>
          </div>
        );

      case TriggerType.COMMENT_ADDED:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contains Keyword (optional)
            </label>
            <input
              type="text"
              value={(config as any).containsKeyword || ''}
              onChange={(e) => updateConfig('containsKeyword', e.target.value || undefined)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., urgent, bug, help"
            />
            <p className="mt-1 text-xs text-gray-500">
              Only trigger if comment contains this keyword
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {TRIGGER_METADATA[triggerType].label}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {TRIGGER_METADATA[triggerType].description}
            </p>
          </div>
        </div>
      </div>

      {renderConfigFields()}
    </div>
  );
}

export { TRIGGER_METADATA };

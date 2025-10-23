'use client';

import { ActionType, type ActionConfig } from '@/types/automation';
import { useState } from 'react';

interface ActionConfigBuilderProps {
  actions: {
    actionType: ActionType;
    actionConfig: ActionConfig;
    order: number;
  }[];
  onChange: (
    actions: {
      actionType: ActionType;
      actionConfig: ActionConfig;
      order: number;
    }[]
  ) => void;
}

const ACTION_METADATA = {
  [ActionType.CHANGE_STATUS]: {
    label: 'Change Status',
    description: 'Update task status',
    icon: '🔄',
  },
  [ActionType.ASSIGN_TO]: {
    label: 'Assign To',
    description: 'Assign task to a user',
    icon: '👤',
  },
  [ActionType.SET_PRIORITY]: {
    label: 'Set Priority',
    description: 'Update task priority',
    icon: '⚡',
  },
  [ActionType.ADD_LABEL]: {
    label: 'Add Label',
    description: 'Add a label to the task',
    icon: '🏷️',
  },
  [ActionType.SEND_NOTIFICATION]: {
    label: 'Send Notification',
    description: 'Send notification to a user',
    icon: '🔔',
  },
  [ActionType.ADD_COMMENT]: {
    label: 'Add Comment',
    description: 'Add a comment to the task',
    icon: '💬',
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

export default function ActionConfigBuilder({
  actions,
  onChange,
}: ActionConfigBuilderProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const addAction = () => {
    const newAction = {
      actionType: ActionType.CHANGE_STATUS,
      actionConfig: { newStatus: 'TODO' },
      order: actions.length,
    };
    onChange([...actions, newAction]);
    setExpandedIndex(actions.length);
  };

  const removeAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    // Reorder remaining actions
    const reorderedActions = newActions.map((action, i) => ({
      ...action,
      order: i,
    }));
    onChange(reorderedActions);
    setExpandedIndex(null);
  };

  const updateAction = (
    index: number,
    field: 'actionType' | 'actionConfig',
    value: any
  ) => {
    const newActions = [...actions];
    if (field === 'actionType') {
      // Reset config when type changes
      newActions[index] = {
        ...newActions[index],
        actionType: value,
        actionConfig: getDefaultConfig(value),
      };
    } else {
      newActions[index] = {
        ...newActions[index],
        actionConfig: value,
      };
    }
    onChange(newActions);
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === actions.length - 1)
    ) {
      return;
    }

    const newActions = [...actions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap actions
    [newActions[index], newActions[targetIndex]] = [
      newActions[targetIndex],
      newActions[index],
    ];

    // Update order numbers
    newActions[index].order = index;
    newActions[targetIndex].order = targetIndex;

    onChange(newActions);
    setExpandedIndex(targetIndex);
  };

  const getDefaultConfig = (actionType: ActionType): ActionConfig => {
    switch (actionType) {
      case ActionType.CHANGE_STATUS:
        return { status: 'TODO' };
      case ActionType.ASSIGN_TO:
        return { userId: '' };
      case ActionType.SET_PRIORITY:
        return { priority: 'MEDIUM' };
      case ActionType.ADD_LABEL:
        return { labelId: '' };
      case ActionType.SEND_NOTIFICATION:
        return { title: '', message: '' };
      case ActionType.ADD_COMMENT:
        return { comment: '' };
    }
  };

  const updateConfigField = (index: number, key: string, value: any) => {
    const newConfig = { ...actions[index].actionConfig, [key]: value };
    updateAction(index, 'actionConfig', newConfig);
  };

  const renderConfigFields = (action: {
    actionType: ActionType;
    actionConfig: ActionConfig;
  }, index: number) => {
    switch (action.actionType) {
      case ActionType.CHANGE_STATUS:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={(action.actionConfig as any).status || ''}
              onChange={(e) => updateConfigField(index, 'status', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case ActionType.ASSIGN_TO:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={(action.actionConfig as any).userId || ''}
              onChange={(e) => updateConfigField(index, 'userId', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter user ID"
              required
            />
          </div>
        );

      case ActionType.SET_PRIORITY:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              value={(action.actionConfig as any).priority || ''}
              onChange={(e) => updateConfigField(index, 'priority', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case ActionType.ADD_LABEL:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={(action.actionConfig as any).labelId || ''}
              onChange={(e) => updateConfigField(index, 'labelId', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter label ID (UUID)"
              required
            />
          </div>
        );

      case ActionType.SEND_NOTIFICATION:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={(action.actionConfig as any).title || ''}
                onChange={(e) => updateConfigField(index, 'title', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notification title"
                maxLength={200}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={(action.actionConfig as any).message || ''}
                onChange={(e) => updateConfigField(index, 'message', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notification message"
                maxLength={1000}
                required
              />
            </div>
          </div>
        );

      case ActionType.ADD_COMMENT:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={(action.actionConfig as any).comment || ''}
              onChange={(e) => updateConfigField(index, 'comment', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter comment text"
              required
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Actions</h3>
        <button
          type="button"
          onClick={addAction}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Action
        </button>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-sm">No actions configured yet</p>
          <p className="text-gray-400 text-xs mt-1">Click "Add Action" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Action Header */}
              <div
                className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{ACTION_METADATA[action.actionType].icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {index + 1}. {ACTION_METADATA[action.actionType].label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ACTION_METADATA[action.actionType].description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveAction(index, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveAction(index, 'down');
                    }}
                    disabled={index === actions.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAction(index);
                    }}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Remove action"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Expand/Collapse */}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Action Config (Expanded) */}
              {expandedIndex === index && (
                <div className="p-4 space-y-4 bg-white">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={action.actionType}
                      onChange={(e) =>
                        updateAction(index, 'actionType', e.target.value as ActionType)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(ACTION_METADATA).map(([type, meta]) => (
                        <option key={type} value={type}>
                          {meta.icon} {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {renderConfigFields(action, index)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { ACTION_METADATA };

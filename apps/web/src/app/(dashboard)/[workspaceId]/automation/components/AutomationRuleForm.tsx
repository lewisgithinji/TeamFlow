'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TriggerType, ActionType, type CreateAutomationRuleInput } from '@/types/automation';
import TriggerConfigBuilder, { TRIGGER_METADATA } from './TriggerConfigBuilder';
import ActionConfigBuilder from './ActionConfigBuilder';
import { automationApi } from '@/lib/api/automation';

interface AutomationRuleFormProps {
  workspaceId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AutomationRuleForm({
  workspaceId,
  onSuccess,
  onCancel,
}: AutomationRuleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [triggerType, setTriggerType] = useState<TriggerType>(TriggerType.STATUS_CHANGED);
  const [triggerConfig, setTriggerConfig] = useState<any>({});
  const [actions, setActions] = useState<
    {
      actionType: ActionType;
      actionConfig: any;
      order: number;
    }[]
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Rule name is required');
      return;
    }

    if (name.length > 100) {
      setError('Rule name must be 100 characters or less');
      return;
    }

    if (description && description.length > 500) {
      setError('Description must be 500 characters or less');
      return;
    }

    if (actions.length === 0) {
      setError('At least one action is required');
      return;
    }

    // Validate trigger config based on type
    if (triggerType === TriggerType.DUE_DATE_APPROACHING) {
      if (!triggerConfig.daysBeforeDue || triggerConfig.daysBeforeDue < 1) {
        setError('Days before due date must be at least 1');
        return;
      }
    }

    // Validate action configs
    for (const action of actions) {
      switch (action.actionType) {
        case ActionType.CHANGE_STATUS:
          if (!(action.actionConfig as any).status) {
            setError('Status is required for "Change Status" action');
            return;
          }
          break;
        case ActionType.ASSIGN_TO:
          if (!(action.actionConfig as any).userId) {
            setError('User ID is required for "Assign To" action');
            return;
          }
          break;
        case ActionType.SET_PRIORITY:
          if (!(action.actionConfig as any).priority) {
            setError('Priority is required for "Set Priority" action');
            return;
          }
          break;
        case ActionType.ADD_LABEL:
          if (!(action.actionConfig as any).labelId) {
            setError('Label ID is required for "Add Label" action');
            return;
          }
          break;
        case ActionType.SEND_NOTIFICATION:
          if (!(action.actionConfig as any).title || !(action.actionConfig as any).message) {
            setError('Title and message are required for "Send Notification" action');
            return;
          }
          break;
        case ActionType.ADD_COMMENT:
          if (!(action.actionConfig as any).comment) {
            setError('Comment is required for "Add Comment" action');
            return;
          }
          break;
      }
    }

    setIsSubmitting(true);

    try {
      const input: CreateAutomationRuleInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        triggerType,
        triggerConfig,
        isActive,
        actions,
      };

      await automationApi.createAutomationRule(workspaceId, input);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/${workspaceId}/automation`);
      }
    } catch (err: any) {
      console.error('Failed to create automation rule:', err);
      setError(err.message || 'Failed to create automation rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(`/${workspaceId}/automation`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Rule Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rule Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Auto-assign high priority tasks"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {name.length}/100 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what this automation does..."
          />
          <p className="mt-1 text-xs text-gray-500">
            {description.length}/500 characters
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Active (rule will run automatically)
          </label>
        </div>
      </div>

      {/* Trigger */}
      <div className="space-y-4 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Trigger</h2>
        <p className="text-sm text-gray-600">When should this automation run?</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trigger Type <span className="text-red-500">*</span>
          </label>
          <select
            value={triggerType}
            onChange={(e) => {
              setTriggerType(e.target.value as TriggerType);
              setTriggerConfig({}); // Reset config when type changes
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(TRIGGER_METADATA).map(([type, meta]) => (
              <option key={type} value={type}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        <TriggerConfigBuilder
          triggerType={triggerType}
          config={triggerConfig}
          onChange={setTriggerConfig}
        />
      </div>

      {/* Actions */}
      <div className="space-y-4 bg-white rounded-lg border border-gray-200 p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
          <p className="text-sm text-gray-600">What should happen when the trigger fires?</p>
        </div>

        <ActionConfigBuilder actions={actions} onChange={setActions} />
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}

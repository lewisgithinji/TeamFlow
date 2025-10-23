'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { automationApi } from '@/lib/api/automation';
import { AutomationRule } from '@/types/automation';
import { TRIGGER_METADATA } from '../components/TriggerConfigBuilder';
import { ACTION_METADATA } from '../components/ActionConfigBuilder';
import ExecutionHistory from '../components/ExecutionHistory';

export default function AutomationRuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const ruleId = params.ruleId as string;

  const [rule, setRule] = useState<AutomationRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRule();
  }, [workspaceId, ruleId]);

  const loadRule = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await automationApi.getAutomationRule(workspaceId, ruleId);
      setRule(data);
    } catch (err: any) {
      console.error('Failed to load automation rule:', err);
      setError(err.message || 'Failed to load automation rule');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderTriggerConfig = (config: any, triggerType: string) => {
    const entries = Object.entries(config).filter(([_, value]) => value !== undefined && value !== null);

    if (entries.length === 0) {
      return <p className="text-sm text-gray-500">No specific configuration</p>;
    }

    return (
      <dl className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex">
            <dt className="text-sm font-medium text-gray-500 capitalize w-32">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </dt>
            <dd className="text-sm text-gray-900">{String(value)}</dd>
          </div>
        ))}
      </dl>
    );
  };

  const renderActionConfig = (config: any) => {
    const entries = Object.entries(config).filter(([_, value]) => value !== undefined && value !== null);

    if (entries.length === 0) {
      return <p className="text-xs text-gray-500">No configuration</p>;
    }

    return (
      <dl className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex text-xs">
            <dt className="font-medium text-gray-500 capitalize mr-2">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </dt>
            <dd className="text-gray-900">{String(value)}</dd>
          </div>
        ))}
      </dl>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !rule) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-lg bg-red-50 p-6 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error || 'Rule not found'}
              </h3>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => router.push(`/${workspaceId}/automation`)}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Back to Rules
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => router.push(`/${workspaceId}/automation`)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{rule.name}</h1>
                {rule.description && (
                  <p className="mt-2 text-gray-600">{rule.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {/* Status Badge */}
                {rule.isActive ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-green-400" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-400" />
                    Inactive
                  </span>
                )}
                {/* Edit/Delete buttons - Not functional yet (Step 3) */}
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                  title="Edit functionality coming in Step 3"
                >
                  Edit
                </button>
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                  title="Delete functionality coming in Step 3"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Created by {rule.createdBy?.name || 'Unknown'}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(rule.createdAt)}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Trigger Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trigger</h2>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {TRIGGER_METADATA[rule.triggerType]?.label || rule.triggerType}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {TRIGGER_METADATA[rule.triggerType]?.description}
              </p>
              {renderTriggerConfig(rule.triggerConfig, rule.triggerType)}
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Actions ({rule.actions?.length || 0})
          </h2>
          {rule.actions && rule.actions.length > 0 ? (
            <div className="space-y-3">
              {rule.actions
                .sort((a, b) => a.order - b.order)
                .map((action, index) => (
                  <div
                    key={action.id}
                    className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">
                          {ACTION_METADATA[action.actionType]?.icon}
                        </span>
                        <h3 className="text-sm font-medium text-gray-900">
                          {ACTION_METADATA[action.actionType]?.label || action.actionType}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {ACTION_METADATA[action.actionType]?.description}
                      </p>
                      {renderActionConfig(action.actionConfig)}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No actions configured</p>
          )}
        </div>

        {/* Execution History */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ExecutionHistory executions={rule.executions || []} />
        </div>
      </div>
    </div>
  );
}

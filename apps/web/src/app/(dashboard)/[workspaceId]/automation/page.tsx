'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { automationApi } from '@/lib/api/automation';
import { AutomationRule } from '@/types/automation';
import AutomationRuleList from './components/AutomationRuleList';

export default function AutomationPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, [workspaceId]);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await automationApi.listAutomationRules(workspaceId);
      setRules(data);
    } catch (err: any) {
      console.error('Failed to load automation rules:', err);
      setError(err.message || 'Failed to load automation rules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRuleClick = (ruleId: string) => {
    router.push(`/${workspaceId}/automation/${ruleId}`);
  };

  const handleCreateNew = () => {
    router.push(`/${workspaceId}/automation/new`);
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
            <p className="mt-2 text-gray-600">
              Automate your workflow with custom rules
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Create Rule
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={loadRules}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      {rules.length === 0 && !error && (
        <div className="mb-6 rounded-lg bg-blue-50 p-6 border border-blue-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Get started with automation
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Create automation rules to streamline your workflow. For example:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Auto-assign tasks when status changes to "In Review"</li>
                  <li>Send notifications when high-priority tasks are created</li>
                  <li>Add labels based on task properties</li>
                  <li>Automatically comment on tasks approaching due dates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <AutomationRuleList rules={rules} onRuleClick={handleRuleClick} />
    </div>
  );
}

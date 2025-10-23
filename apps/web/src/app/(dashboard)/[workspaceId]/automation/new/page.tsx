'use client';

import { useParams, useRouter } from 'next/navigation';
import AutomationRuleForm from '../components/AutomationRuleForm';

export default function NewAutomationPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const handleSuccess = () => {
    router.push(`/${workspaceId}/automation`);
  };

  const handleCancel = () => {
    router.push(`/${workspaceId}/automation`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Automation Rule
            </h1>
            <p className="mt-2 text-gray-600">
              Set up a new automation to streamline your workflow
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <AutomationRuleForm
        workspaceId={workspaceId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

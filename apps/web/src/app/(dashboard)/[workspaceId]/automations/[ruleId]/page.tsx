'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Node, Edge } from 'reactflow';
import { ArrowLeftIcon, CheckIcon, PlayIcon, PauseIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

import { WorkflowCanvas } from '@/components/automation/WorkflowCanvas';
import { TriggerConfigPanel } from '@/components/automation/panels/TriggerConfigPanel';
import { ActionConfigPanel } from '@/components/automation/panels/ActionConfigPanel';
import { WorkflowState, TriggerNodeData, ActionNodeData, AutomationRule } from '@/lib/automation/types';
import { workflowToAPI, apiToWorkflow, validateWorkflow, createTriggerNode, createActionNode } from '@/lib/automation/workflow-converter';
import { TRIGGER_TYPES, ACTION_TYPES } from '@/lib/automation/constants';

interface WorkflowBuilderPageProps {
  params: {
    workspaceId: string;
    ruleId: string;
  };
}

export default function WorkflowBuilderPage({ params }: WorkflowBuilderPageProps) {
  const { workspaceId, ruleId } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = ruleId === 'new';

  const [workflow, setWorkflow] = useState<WorkflowState>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showTriggerPanel, setShowTriggerPanel] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [showTriggerMenu, setShowTriggerMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch existing workflow
  const { data: existingRule, isLoading } = useQuery({
    queryKey: ['automation-rule', workspaceId, ruleId],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/automation/rules/${ruleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to fetch automation rule');
      const data = await response.json();
      return data.data as AutomationRule;
    },
    enabled: !isNew,
  });

  // Load existing workflow into canvas
  useEffect(() => {
    if (existingRule) {
      setWorkflow(apiToWorkflow(existingRule));
      setWorkflowName(existingRule.name);
      setWorkflowDescription(existingRule.description || '');
      setIsActive(existingRule.isActive);
    }
  }, [existingRule]);

  // Save workflow mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log('🔍 Starting workflow validation...', workflow);
      const validation = validateWorkflow(workflow);
      console.log('✅ Validation result:', validation);

      if (!validation.valid) {
        // Create a custom error object with all validation errors
        console.error('❌ Validation failed with errors:', validation.errors);
        const error: any = new Error('Validation failed');
        error.validationErrors = validation.errors;
        throw error;
      }

      const apiData = workflowToAPI(workflow, workspaceId, workflowName, workflowDescription, !isNew);
      apiData.isActive = isActive;

      const url = isNew
        ? `http://localhost:4000/api/workspaces/${workspaceId}/automation/rules`
        : `http://localhost:4000/api/workspaces/${workspaceId}/automation/rules/${ruleId}`;

      const method = isNew ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || error.message || 'Failed to save workflow');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Workflow saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['automation-rules', workspaceId] });

      if (isNew) {
        // Redirect to the newly created workflow
        router.push(`/${workspaceId}/automations/${data.data.id}`);
      }
    },
    onError: (error: any) => {
      console.error('🚨 Mutation error caught:', error);
      console.error('🚨 Error validationErrors:', error.validationErrors);

      // If there are validation errors, show them in a list
      if (error.validationErrors && error.validationErrors.length > 0) {
        console.log('📋 Showing validation errors as toasts:', error.validationErrors);
        error.validationErrors.forEach((err: string) => {
          console.log('🍞 Showing toast:', err);
          toast.error(err, { duration: 5000 });
        });
      } else {
        console.log('🍞 Showing generic error toast:', error.message);
        toast.error(error.message || 'Failed to save workflow');
      }
    },
  });

  // Handle workflow changes
  const handleWorkflowChange = useCallback((newWorkflow: WorkflowState) => {
    setWorkflow(newWorkflow);
  }, []);

  // Handle node selection
  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node);
    if (node) {
      if (node.type === 'trigger') {
        setShowTriggerPanel(true);
        setShowActionPanel(false);
      } else if (node.type === 'action') {
        setShowActionPanel(true);
        setShowTriggerPanel(false);
      }
    } else {
      setShowTriggerPanel(false);
      setShowActionPanel(false);
    }
  }, []);

  // Add trigger node
  const handleAddTrigger = (triggerType: string) => {
    console.log('Adding trigger:', triggerType);
    const newNode = createTriggerNode(triggerType);
    console.log('Created trigger node:', newNode);

    setWorkflow((prev) => {
      const updatedWorkflow = {
        ...prev,
        nodes: [newNode, ...prev.nodes.filter((n) => n.type !== 'trigger')],
      };
      console.log('Updated workflow:', updatedWorkflow);
      return updatedWorkflow;
    });

    setShowTriggerMenu(false);
    toast.success('Trigger added');
  };

  // Add action node
  const handleAddAction = (actionType: string) => {
    console.log('Adding action:', actionType);
    const actionCount = workflow.nodes.filter((n) => n.type === 'action').length;
    const newNode = createActionNode(actionType, actionCount);
    console.log('Created action node:', newNode);

    setWorkflow((prev) => {
      const newNodes = [...prev.nodes, newNode];
      const newEdges = [...prev.edges];

      // Auto-connect to last node
      if (prev.nodes.length > 0) {
        const lastNode = prev.nodes[prev.nodes.length - 1];
        newEdges.push({
          id: `e-${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
        });
      }

      const updatedWorkflow = { nodes: newNodes, edges: newEdges };
      console.log('Updated workflow:', updatedWorkflow);
      return updatedWorkflow;
    });

    setShowActionMenu(false);
    toast.success('Action added');
  };

  // Update trigger config
  const handleTriggerConfigSave = (config: any) => {
    if (selectedNode && selectedNode.type === 'trigger') {
      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, config } }
            : node
        ),
      }));
      toast.success('Trigger configured');
    }
  };

  // Update action config
  const handleActionConfigSave = (config: any) => {
    if (selectedNode && selectedNode.type === 'action') {
      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, config } }
            : node
        ),
      }));
      toast.success('Action configured');
    }
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleBack = () => {
    router.push(`/${workspaceId}/automations`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back
          </button>

          <div className="h-6 w-px bg-gray-300" />

          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 bg-transparent"
            placeholder="Workflow name"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isActive
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isActive ? (
              <>
                <PlayIcon className="h-4 w-4" />
                Active
              </>
            ) : (
              <>
                <PauseIcon className="h-4 w-4" />
                Inactive
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3">
        <div className="relative">
          <button
            onClick={() => setShowTriggerMenu(!showTriggerMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Trigger
          </button>

          {showTriggerMenu && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              {Object.entries(TRIGGER_TYPES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAddTrigger(key)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{value.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{value.label}</div>
                      <div className="text-xs text-gray-600">{value.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Action
          </button>

          {showActionMenu && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              {Object.entries(ACTION_TYPES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAddAction(key)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{value.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{value.label}</div>
                      <div className="text-xs text-gray-600">{value.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="text-sm text-gray-600">
          {workflow.nodes.filter((n) => n.type === 'trigger').length} trigger,{' '}
          {workflow.nodes.filter((n) => n.type === 'action').length} actions
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <WorkflowCanvas
          initialWorkflow={workflow}
          onWorkflowChange={handleWorkflowChange}
          onNodeSelect={handleNodeSelect}
        />

        {workflow.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start building your workflow
              </h3>
              <p className="text-gray-600">
                Click "Add Trigger" to begin
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Panels */}
      {showTriggerPanel && selectedNode && selectedNode.type === 'trigger' && (
        <TriggerConfigPanel
          workspaceId={workspaceId}
          triggerType={(selectedNode.data as TriggerNodeData).triggerType}
          config={(selectedNode.data as TriggerNodeData).config}
          onSave={handleTriggerConfigSave}
          onClose={() => setShowTriggerPanel(false)}
        />
      )}

      {showActionPanel && selectedNode && selectedNode.type === 'action' && (
        <ActionConfigPanel
          workspaceId={workspaceId}
          actionType={(selectedNode.data as ActionNodeData).actionType}
          config={(selectedNode.data as ActionNodeData).config}
          onSave={handleActionConfigSave}
          onClose={() => setShowActionPanel(false)}
        />
      )}
    </div>
  );
}

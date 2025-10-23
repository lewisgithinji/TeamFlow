import { api } from '../api-client';
import {
  AutomationRule,
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
} from '@/types/automation';

export const automationApi = {
  /**
   * List all automation rules for a workspace
   */
  listAutomationRules: async (workspaceId: string): Promise<AutomationRule[]> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/automation/rules`);
    return response.data || [];
  },

  /**
   * Get a single automation rule by ID
   */
  getAutomationRule: async (
    workspaceId: string,
    ruleId: string
  ): Promise<AutomationRule> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/automation/rules/${ruleId}`);
    return response.data;
  },

  /**
   * Create a new automation rule
   */
  createAutomationRule: async (
    workspaceId: string,
    input: CreateAutomationRuleInput
  ): Promise<AutomationRule> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/automation/rules`, input);
    return response.data;
  },

  /**
   * Update an automation rule (for future Step 3)
   */
  updateAutomationRule: async (
    workspaceId: string,
    ruleId: string,
    input: UpdateAutomationRuleInput
  ): Promise<AutomationRule> => {
    const response = await api.patch(
      `/api/workspaces/${workspaceId}/automation/rules/${ruleId}`,
      input
    );
    return response.data;
  },

  /**
   * Delete an automation rule (for future Step 3)
   */
  deleteAutomationRule: async (
    workspaceId: string,
    ruleId: string
  ): Promise<void> => {
    return api.delete(`/api/workspaces/${workspaceId}/automation/rules/${ruleId}`);
  },

  /**
   * Toggle active status of a rule (for future Step 3)
   */
  toggleAutomationRule: async (
    workspaceId: string,
    ruleId: string,
    isActive: boolean
  ): Promise<AutomationRule> => {
    const response = await api.patch(
      `/api/workspaces/${workspaceId}/automation/rules/${ruleId}`,
      { isActive }
    );
    return response.data;
  },
};

/**
 * Workspace Store
 * Reference: Sprint 1 Planning - Task 2.1.7
 * Manages workspace state, current workspace selection, and API integration
 */

import { create } from 'zustand';

export interface WorkspaceOwner {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  owner: WorkspaceOwner;
  memberCount: number;
  projectCount: number;
  joinedAt: Date;
  createdAt: Date;
}

interface WorkspaceStore {
  // State
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // API Integration
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (data: { name: string; description?: string; logo?: string }) => Promise<Workspace>;
  switchWorkspace: (workspaceId: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  // Initial state
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  // Simple setters
  setWorkspaces: (workspaces) => set({ workspaces }),

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
    if (workspace && typeof window !== 'undefined') {
      localStorage.setItem('currentWorkspaceId', workspace.id);
    }
  },

  addWorkspace: (workspace) => {
    set((state) => ({
      workspaces: [workspace, ...state.workspaces],
    }));
  },

  updateWorkspace: (id, updates) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
      currentWorkspace:
        state.currentWorkspace?.id === id
          ? { ...state.currentWorkspace, ...updates }
          : state.currentWorkspace,
    }));
  },

  removeWorkspace: (id) => {
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace:
        state.currentWorkspace?.id === id ? null : state.currentWorkspace,
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      workspaces: [],
      currentWorkspace: null,
      isLoading: false,
      error: null,
    }),

  // API Integration
  /**
   * Fetch user workspaces from API
   * Reference: Sprint 1 Planning - Task 2.1.3
   */
  fetchWorkspaces: async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) {
      set({ error: 'No authentication token found' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/workspaces`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const result = await response.json();
      const workspaces = result.data || [];

      set({ workspaces, isLoading: false });

      // Set current workspace from localStorage or first workspace
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      const currentWorkspace =
        workspaces.find((w: Workspace) => w.id === savedWorkspaceId) ||
        workspaces[0] ||
        null;

      set({ currentWorkspace });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch workspaces',
        isLoading: false,
      });
    }
  },

  /**
   * Create new workspace
   * Reference: Sprint 1 Planning - Task 2.1.2
   */
  createWorkspace: async (data) => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot create workspace on server');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create workspace');
      }

      const result = await response.json();
      const workspace = result.data;

      // Add to store
      get().addWorkspace(workspace);
      get().setCurrentWorkspace(workspace);
      set({ isLoading: false });

      return workspace;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create workspace';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Switch active workspace
   * Reference: Sprint 1 Planning - Task 2.1.6
   */
  switchWorkspace: (workspaceId) => {
    const workspace = get().workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      get().setCurrentWorkspace(workspace);
    }
  },
}));

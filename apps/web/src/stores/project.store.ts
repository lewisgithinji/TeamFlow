/**
 * Project Store
 * Reference: Sprint 1 Planning - Task 2.4.7
 * Manages project state and API integration
 */

import { create } from 'zustand';

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  icon: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  archived: boolean;
  createdBy: string | null;
  taskCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // API Integration
  fetchWorkspaceProjects: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, data: { name: string; description?: string; icon?: string; visibility?: 'PUBLIC' | 'PRIVATE' }) => Promise<Project>;
  selectProject: (projectId: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Simple setters
  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => {
    set({ currentProject: project });
    if (project && typeof window !== 'undefined') {
      localStorage.setItem('currentProjectId', project.id);
    }
  },

  addProject: (project) => {
    set((state) => ({
      projects: [project, ...state.projects],
    }));
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates }
          : state.currentProject,
    }));
  },

  removeProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject:
        state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,
    }),

  // API Integration
  /**
   * Fetch projects for a workspace
   * Reference: Sprint 1 Planning - Task 2.4.3
   */
  fetchWorkspaceProjects: async (workspaceId: string) => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) {
      set({ error: 'No authentication token found' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const result = await response.json();
      const projects = result.data || [];

      set({ projects, isLoading: false });

      // Set current project from localStorage or first project
      const savedProjectId = localStorage.getItem('currentProjectId');
      const currentProject =
        projects.find((p: Project) => p.id === savedProjectId) ||
        projects[0] ||
        null;

      set({ currentProject });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
        isLoading: false,
      });
    }
  },

  /**
   * Create new project
   * Reference: Sprint 1 Planning - Task 2.4.2
   */
  createProject: async (workspaceId: string, data) => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot create project on server');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workspaceId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }

      const result = await response.json();
      const project = result.data;

      // Add to store
      get().addProject(project);
      get().setCurrentProject(project);
      set({ isLoading: false });

      return project;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Select a project as current
   */
  selectProject: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (project) {
      get().setCurrentProject(project);
    }
  },
}));

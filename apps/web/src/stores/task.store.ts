/**
 * Task Store
 * Reference: Sprint 1 Planning - Task 3.1
 * Manages task state and API integration
 */

import { create } from 'zustand';
import { api } from '@/lib/api-client';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  storyPoints: number | null;
  dueDate: Date | null;
  createdBy: string | null;
  position: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  assignees?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  }>;
  labels?: Array<{
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  creator?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
}

interface TaskStore {
  // State
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  setCurrentTask: (task: Task | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // API Integration
  fetchProjectTasks: (projectId: string) => Promise<void>;
  createTask: (data: {
    projectId: string;
    title: string;
    description?: string;
    status?: Task['status'];
    priority?: Task['priority'];
    storyPoints?: number;
    dueDate?: Date;
    assigneeIds?: string[];
    labelIds?: string[];
  }) => Promise<Task>;
  updateTaskById: (taskId: string, data: Partial<Task>) => Promise<Task>;
  updateTaskPosition: (taskId: string, status: Task['status'], position: number) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,

  // Simple setters
  setTasks: (tasks) => set({ tasks }),
  setCurrentTask: (task) => set({ currentTask: task }),
  addTask: (task) => {
    set((state) => ({
      tasks: [task, ...state.tasks],
    }));
  },
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      currentTask:
        state.currentTask?.id === id
          ? { ...state.currentTask, ...updates }
          : state.currentTask,
    }));
  },
  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      currentTask: state.currentTask?.id === id ? null : state.currentTask,
    }));
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      tasks: [],
      currentTask: null,
      isLoading: false,
      error: null,
    }),

  // API Integration
  /**
   * Fetch tasks for a project
   */
  fetchProjectTasks: async (projectId: string) => {
    if (typeof window === 'undefined') return;

    set({ isLoading: true, error: null });

    try {
      const result = await api.get(`/api/projects/${projectId}/tasks`);
      const tasks = result.data || [];

      set({ tasks, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false,
      });
    }
  },

  /**
   * Create new task
   */
  createTask: async (data) => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot create task on server');
    }

    set({ isLoading: true, error: null });

    try {
      const result = await api.post(`/api/tasks`, data);
      const task = result.data;

      // Add to store
      get().addTask(task);
      set({ isLoading: false });

      return task;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Update task
   */
  updateTaskById: async (taskId: string, data: Partial<Task>) => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot update task on server');
    }

    set({ isLoading: true, error: null });

    try {
      const result = await api.patch(`/api/tasks/${taskId}`, data);
      const task = result.data;

      // Update in store
      get().updateTask(taskId, task);
      set({ isLoading: false });

      return task;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Update task position (for drag-and-drop)
   */
  updateTaskPosition: async (taskId: string, status: Task['status'], position: number) => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot update task position on server');
    }

    try {
      const result = await api.patch(`/api/tasks/${taskId}/position`, {
        status,
        position,
      });
      const task = result.data;

      // Update in store
      get().updateTask(taskId, task);

      return task;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update task position';
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Delete task
   */
  deleteTask: async (taskId: string) => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot delete task on server');
    }

    set({ isLoading: true, error: null });

    try {
      await api.delete(`/api/tasks/${taskId}`);

      // Remove from store
      get().removeTask(taskId);
      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete task';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));

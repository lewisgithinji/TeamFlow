import { create } from 'zustand';
import { api } from '@/lib/api-client';

interface Activity {
  id: string;
  workspaceId: string;
  userId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  metadata: Record<string, any>;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  workspace?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
    projectId: string;
  } | null;
}

interface ActivityFilters {
  workspaceId?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface ActivityStore {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  currentFilters: ActivityFilters;

  // Actions
  fetchActivities: (filters?: ActivityFilters) => Promise<void>;
  setFilters: (filters: ActivityFilters) => void;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  // Initial state
  activities: [],
  isLoading: false,
  error: null,
  total: 0,
  hasMore: false,
  currentFilters: { limit: 25, offset: 0 },

  /**
   * Fetch activities with filters
   */
  fetchActivities: async (filters: ActivityFilters = {}) => {
    if (typeof window === 'undefined') return;

    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();

      const appliedFilters = { ...get().currentFilters, ...filters };

      if (appliedFilters.workspaceId) {
        params.append('workspaceId', appliedFilters.workspaceId);
      }
      if (appliedFilters.userId) {
        params.append('userId', appliedFilters.userId);
      }
      if (appliedFilters.entityType) {
        params.append('entityType', appliedFilters.entityType);
      }
      if (appliedFilters.entityId) {
        params.append('entityId', appliedFilters.entityId);
      }
      if (appliedFilters.startDate) {
        params.append('startDate', appliedFilters.startDate);
      }
      if (appliedFilters.endDate) {
        params.append('endDate', appliedFilters.endDate);
      }
      if (appliedFilters.limit) {
        params.append('limit', String(appliedFilters.limit));
      }
      if (appliedFilters.offset) {
        params.append('offset', String(appliedFilters.offset));
      }

      const result = await api.get(
        `/api/activities${params.toString() ? `?${params.toString()}` : ''}`
      );

      const activities = result.data || [];
      const pagination = result.pagination || { total: 0, hasMore: false };

      set({
        activities: appliedFilters.offset === 0
          ? activities
          : [...get().activities, ...activities],
        total: pagination.total,
        hasMore: pagination.hasMore,
        isLoading: false,
        currentFilters: appliedFilters,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activities',
        isLoading: false,
      });
    }
  },

  /**
   * Set filters and fetch
   */
  setFilters: (filters: ActivityFilters) => {
    set({ currentFilters: { ...get().currentFilters, ...filters, offset: 0 } });
    get().fetchActivities();
  },

  /**
   * Load more activities
   */
  loadMore: async () => {
    const { hasMore, isLoading, currentFilters, activities } = get();

    if (!hasMore || isLoading) return;

    const newFilters = {
      ...currentFilters,
      offset: activities.length,
    };

    await get().fetchActivities(newFilters);
  },

  /**
   * Reset state
   */
  reset: () => {
    set({
      activities: [],
      isLoading: false,
      error: null,
      total: 0,
      hasMore: false,
      currentFilters: { limit: 25, offset: 0 },
    });
  },
}));

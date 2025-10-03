/**
 * Notification Store
 * Manages notification state and API integration
 */

import { create } from 'zustand';
import { api } from '@/lib/api-client';

export interface Notification {
  id: string;
  userId: string;
  type: 'TASK_ASSIGNED' | 'TASK_DUE_SOON' | 'MENTION' | 'COMMENT' | 'WORKSPACE_INVITE' | 'TASK_COMPLETED' | 'MEMBER_JOINED' | 'MEMBER_LEFT';
  title: string;
  message: string;
  linkUrl: string | null;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

interface NotificationStore {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleDropdown: () => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  reset: () => void;

  // API Integration
  fetchNotifications: (filters?: { isRead?: boolean; limit?: number }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  isOpen: false,

  // Simple setters
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleDropdown: () => set((state) => ({ isOpen: !state.isOpen })),
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },
  updateNotification: (id, updates) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
    }));
  },
  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
  },
  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      isOpen: false,
    }),

  // API Integration
  /**
   * Fetch notifications
   */
  fetchNotifications: async (filters = {}) => {
    if (typeof window === 'undefined') return;

    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (filters.isRead !== undefined) {
        params.append('isRead', String(filters.isRead));
      }
      if (filters.limit) {
        params.append('limit', String(filters.limit));
      }

      const result = await api.get(
        `/api/notifications${params.toString() ? `?${params.toString()}` : ''}`
      );
      const notifications = result.data || [];

      set({ notifications, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        isLoading: false,
      });
    }
  },

  /**
   * Fetch unread count
   */
  fetchUnreadCount: async () => {
    if (typeof window === 'undefined') return;

    try {
      const result = await api.get('/api/notifications/unread/count');
      const count = result.data?.count || 0;

      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string) => {
    if (typeof window === 'undefined') return;

    try {
      await api.patch(`/api/notifications/${notificationId}/read`);

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    if (typeof window === 'undefined') return;

    try {
      await api.post('/api/notifications/mark-all-read');

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string) => {
    if (typeof window === 'undefined') return;

    try {
      await api.delete(`/api/notifications/${notificationId}`);

      // Update local state
      get().removeNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  },
}));

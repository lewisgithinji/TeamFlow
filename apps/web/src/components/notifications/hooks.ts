'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

const markAllNotificationsAsRead = async () => {
  const { data } = await apiClient.post('/notifications/mark-all-read');
  return data;
};

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (data) => {
      toast.success(`${data.data.count} notifications marked as read.`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: () => {
      toast.error('Failed to mark notifications as read.');
    },
  });
}

const fetchNotifications = async ({
  pageParam = 0,
  isRead,
}: {
  pageParam?: number;
  isRead?: boolean;
}) => {
  const limit = 10;
  const offset = pageParam * limit;

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (isRead !== undefined) {
    params.append('isRead', String(isRead));
  }

  const { data } = await apiClient.get(`/notifications?${params.toString()}`);
  return data;
};

export function useInfiniteNotifications(filters: { isRead?: boolean }) {
  return useInfiniteQuery({
    queryKey: ['notifications', filters],
    queryFn: ({ pageParam }) => fetchNotifications({ pageParam, ...filters }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page indicated there are more notifications,
      // return the next page number. Otherwise, return undefined.
      if (lastPage.pagination.hasMore) {
        return allPages.length;
      }
      return undefined;
    },
  });
}

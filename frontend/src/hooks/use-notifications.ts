import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/lib/socket';
import type { Notification } from '@/types';

export function useNotifications() {
  const qc = useQueryClient();
  const { socket } = useSocket();

  const query = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  // Realtime: listen for new notifications
  useEffect(() => {
    if (!socket) return;

    const handler = (notification: Notification) => {
      qc.setQueryData<Notification[]>(['notifications'], (old) =>
        old ? [notification, ...old] : [notification],
      );
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    };

    socket.on('notification', handler);
    return () => {
      socket.off('notification', handler);
    };
  }, [socket, qc]);

  return query;
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data),
    refetchInterval: 30000, // fallback polling every 30s
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      qc.invalidateQueries({ queryKey: ['unread-by-project'] });
      qc.invalidateQueries({ queryKey: ['unread-message-count'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      qc.invalidateQueries({ queryKey: ['unread-by-project'] });
      qc.invalidateQueries({ queryKey: ['unread-message-count'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/notifications/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      qc.invalidateQueries({ queryKey: ['unread-by-project'] });
      qc.invalidateQueries({ queryKey: ['unread-message-count'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

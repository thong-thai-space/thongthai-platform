import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User } from '@/types';

export function useTeam() {
  return useQuery<User[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; phone?: string }) =>
      api.post('/users/members', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; phone?: string; role?: string; isActive?: boolean }) =>
      api.patch(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });
}

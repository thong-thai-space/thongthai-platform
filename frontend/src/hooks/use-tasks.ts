import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Task } from '@/types';

export function useTasks(projectId?: string) {
  return useQuery<Task[]>({
    queryKey: ['tasks', { projectId }],
    queryFn: () =>
      api.get('/tasks', { params: projectId ? { projectId } : undefined }).then((r) => r.data),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useMyTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'my'],
    queryFn: () => api.get('/tasks/my').then((r) => r.data),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/tasks/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => api.post('/tasks', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: string }) =>
      api.patch(`/tasks/${id}`, data).then((r) => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks', variables.id] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.post(`/tasks/${id}/comments`, { content }).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks', variables.id] });
    },
  });
}

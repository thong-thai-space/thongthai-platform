import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Project } from '@/types';

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useShowcaseProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects', 'showcase'],
    queryFn: () => api.get('/portfolio').then((r) => r.data),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) => api.post('/projects', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Project> & { id: string }) =>
      api.patch(`/projects/${id}`, data).then((r) => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', variables.id] });
      qc.invalidateQueries({ queryKey: ['projects', 'showcase'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdatePortfolioProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Project> & { id: string }) =>
      api.patch(`/portfolio/${id}`, data).then((r) => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', variables.id] });
      qc.invalidateQueries({ queryKey: ['projects', 'showcase'] });
    },
  });
}

export function useUploadPortfolioThumbnail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('thumbnail', file);
      const response = await api.post(`/portfolio/${id}/thumbnail`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', variables.id] });
      qc.invalidateQueries({ queryKey: ['projects', 'showcase'] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCreateProjectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      budget?: number;
      currency?: string;
      deadline?: string;
      techStack?: string[];
    }) => api.post('/projects/request', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAcceptProjectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/projects/${id}/accept`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateProjectAsClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      budget?: number;
      currency?: string;
      deadline?: string;
      techStack?: string[];
    }) => api.patch(`/projects/${id}/client-update`, data).then((r) => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', variables.id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

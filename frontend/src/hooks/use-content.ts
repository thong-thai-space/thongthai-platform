import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// CMS content shape is intentionally permissive — each section has its own schema
// validated by the backend ContentSectionValidator. We model the data as JSON-like.
export type ContentPayload = Record<string, unknown>;

export interface SiteContent {
  id: string;
  section: string;
  data: ContentPayload;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

export function useAllContent() {
  return useQuery<SiteContent[]>({
    queryKey: ['content'],
    queryFn: () => api.get('/content').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSectionContent(section: string) {
  return useQuery<SiteContent>({
    queryKey: ['content', section],
    queryFn: () => api.get(`/content/${section}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUpdateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      section,
      data,
      isActive,
    }: {
      section: string;
      data: ContentPayload;
      isActive?: boolean;
    }) =>
      api.put(`/content/${section}`, { data, isActive }).then((r) => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['content'] });
      qc.invalidateQueries({ queryKey: ['content', variables.section] });
    },
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (section: string) => api.delete(`/content/${section}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content'] }),
  });
}

export function useSeedContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/content/seed').then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content'] }),
  });
}

export function useUploadContentImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/content/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as { url: string };
    },
  });
}

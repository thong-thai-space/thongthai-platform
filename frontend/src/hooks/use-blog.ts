import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { BlogPost, BlogListResult, BlogSitemapSlug } from '@/types';

// ─── Query keys ────────────────────────────────────────────────────────────────

export const blogKeys = {
  all: ['blog'] as const,
  public: (locale: string, page: number, tag?: string) =>
    ['blog', 'public', locale, page, tag ?? ''] as const,
  post: (locale: string, slug: string) => ['blog', 'post', locale, slug] as const,
  sitemap: ['blog', 'sitemap'] as const,
  adminList: (page: number, locale?: string, status?: string) =>
    ['blog', 'admin', page, locale ?? '', status ?? ''] as const,
  adminPost: (id: string) => ['blog', 'admin', id] as const,
};

// ─── Public hooks ───────────────────────────────────────────────────────────────

export function useBlogPosts(page = 1, tag?: string) {
  const locale = useLocale();
  return useQuery<BlogListResult>({
    queryKey: blogKeys.public(locale, page, tag),
    queryFn: () =>
      api
        .get('/blog', { params: { locale: locale.toUpperCase(), page, pageSize: 9, tag } })
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlogPost(slug: string) {
  const locale = useLocale();
  return useQuery<BlogPost>({
    queryKey: blogKeys.post(locale, slug),
    queryFn: () =>
      api.get(`/blog/${locale.toUpperCase()}/${slug}`).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useBlogSitemap() {
  return useQuery<BlogSitemapSlug[]>({
    queryKey: blogKeys.sitemap,
    queryFn: () => api.get('/blog/sitemap').then((r) => r.data),
    staleTime: 30 * 60 * 1000,
  });
}

// ─── Admin hooks ────────────────────────────────────────────────────────────────

export interface AdminBlogListParams {
  page?: number;
  pageSize?: number;
  locale?: string;
  status?: string;
}

export function useAdminBlogPosts(params: AdminBlogListParams = {}) {
  const { page = 1, pageSize = 25, locale, status } = params;
  return useQuery<BlogListResult>({
    queryKey: blogKeys.adminList(page, locale, status),
    queryFn: () =>
      api
        .get('/admin/blog', { params: { page, pageSize, locale, status } })
        .then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

export function useAdminBlogPost(id: string) {
  return useQuery<BlogPost>({
    queryKey: blogKeys.adminPost(id),
    queryFn: () => api.get(`/admin/blog/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BlogPost> & { locale: string }) =>
      api.post('/admin/blog', data).then((r) => r.data as BlogPost),
    onSuccess: () => qc.invalidateQueries({ queryKey: blogKeys.all }),
  });
}

export function useUpdateBlogPost(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BlogPost>) =>
      api.patch(`/admin/blog/${id}`, data).then((r) => r.data as BlogPost),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

export function usePublishBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/blog/${id}/publish`).then((r) => r.data as BlogPost),
    onSuccess: () => qc.invalidateQueries({ queryKey: blogKeys.all }),
  });
}

export function useUnpublishBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/blog/${id}/unpublish`).then((r) => r.data as BlogPost),
    onSuccess: () => qc.invalidateQueries({ queryKey: blogKeys.all }),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/blog/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: blogKeys.all }),
  });
}

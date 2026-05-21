import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

// CMS content shape is intentionally permissive — each section has its own schema
// validated by the backend ContentSectionValidator. We model the data as JSON-like.
export type ContentPayload = Record<string, unknown>;

const SUPPORTED_LOCALES = ['vi', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Per-locale envelope as stored in the backend.
 * Either locale may be null (frontend then falls back to i18n messages).
 */
export type LocalizedContentPayload = Partial<Record<SupportedLocale, ContentPayload | null>>;

/**
 * Raw record as returned by the API — `data` holds the per-locale envelope.
 * Use this when the caller (e.g. admin editor) needs both locales.
 */
export interface SiteContentRaw {
  id: string;
  section: string;
  data: LocalizedContentPayload;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

/**
 * Locale-resolved record returned by `useSectionContent` — `data` is the slice
 * for the current locale (or null if not present).
 *
 * Consumers (landing components) treat this exactly like the old SiteContent type
 * because the hook hides the per-locale envelope.
 */
export interface SiteContent {
  id: string;
  section: string;
  data: ContentPayload | null;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Pattern: Adapter — converts the per-locale envelope into a locale-specific slice.
// Backwards-compat: if a row hasn't been migrated yet (legacy flat shape), the data is
// returned as-is so the page doesn't break.
function extractLocaleSlice(
  data: unknown,
  locale: string,
): ContentPayload | null {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  const envelope = data as Record<string, unknown>;
  const hasLocaleKeys = SUPPORTED_LOCALES.some((l) => l in envelope);
  if (hasLocaleKeys) {
    const slice = envelope[locale];
    if (slice === null || slice === undefined) return null;
    if (typeof slice === 'object' && !Array.isArray(slice)) {
      return slice as ContentPayload;
    }
    return null;
  }
  // Legacy unwrapped shape — return as-is so unmigrated rows still render.
  return envelope as ContentPayload;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch all CMS sections. Returns RAW records (per-locale envelope) — used by the
 * admin dashboard which needs to edit both locales.
 */
export function useAllContent() {
  return useQuery<SiteContentRaw[]>({
    queryKey: ['content'],
    queryFn: () => api.get('/content').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single section, with `data` pre-resolved to the current locale.
 *
 * Landing components call this and treat `data?.data` as the section payload —
 * the per-locale envelope is hidden from them.
 */
export function useSectionContent(section: string) {
  const locale = useLocale();
  const query = useQuery<SiteContentRaw | null>({
    queryKey: ['content', section],
    queryFn: () => api.get(`/content/${section}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Pattern: Decorator — wrap the React Query result, replacing `data.data`
  // with the current-locale slice while preserving every other query field.
  const localized = useMemo<SiteContent | null | undefined>(() => {
    if (!query.data) return query.data as null | undefined;
    return {
      ...query.data,
      data: extractLocaleSlice(query.data.data, locale),
    };
  }, [query.data, locale]);

  return { ...query, data: localized };
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
      // Accepts a partial per-locale envelope: `{ vi?: ..., en?: ... }`.
      // Backend merges with the existing record so callers can save one locale at a time.
      data: LocalizedContentPayload;
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

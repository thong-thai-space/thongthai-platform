import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { EditorLocale } from '@/lib/cms-namespaces';

// namespace -> override payload (deep-partial of the namespace messages)
export type LocaleOverrides = Record<string, Record<string, unknown>>;

const overridesKey = (locale: EditorLocale) =>
  ['content-overrides', locale] as const;

export function useContentOverrides(locale: EditorLocale) {
  return useQuery({
    queryKey: overridesKey(locale),
    queryFn: async () => {
      const { data } = await api.get<LocaleOverrides>(
        `/content/admin/overrides/${locale}`,
      );
      return data ?? {};
    },
  });
}

export function useUpdateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      locale: EditorLocale;
      namespace: string;
      data: Record<string, unknown>;
    }) => {
      await api.put(
        `/content/admin/overrides/${vars.locale}/${vars.namespace}`,
        { data: vars.data },
      );
    },
    onSuccess: (_res, vars) =>
      qc.invalidateQueries({ queryKey: overridesKey(vars.locale) }),
  });
}

export function useResetOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { locale: EditorLocale; namespace: string }) => {
      await api.delete(
        `/content/admin/overrides/${vars.locale}/${vars.namespace}`,
      );
    },
    onSuccess: (_res, vars) =>
      qc.invalidateQueries({ queryKey: overridesKey(vars.locale) }),
  });
}

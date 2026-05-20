import { getApiOrigin } from '@/lib/asset-url';

// Pattern: Pure helpers — no React state, isolated for reuse + testing
// These are used by the content management page's editors to translate between
// the editing UI shape and the persisted JSON payload.

export function toDisplayLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (m) => m.toUpperCase());
}

export function isObjectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildDefaultFromTemplate(template: unknown): unknown {
  if (Array.isArray(template)) return [];
  if (isObjectValue(template)) {
    const next: Record<string, unknown> = {};
    Object.entries(template).forEach(([k, v]) => {
      next[k] = buildDefaultFromTemplate(v);
    });
    return next;
  }
  if (typeof template === 'number') return 0;
  if (typeof template === 'boolean') return false;
  if (template === null) return null;
  return '';
}

export function normalizeByTemplate(value: unknown, template: unknown): unknown {
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) return template;
    if (template.length === 0) return value;

    const sample = template[0];
    return value.map((item) => normalizeByTemplate(item, sample));
  }

  if (isObjectValue(template)) {
    if (!isObjectValue(value)) return template;

    const normalized: Record<string, unknown> = { ...value };
    Object.entries(template).forEach(([key, templateValue]) => {
      normalized[key] = normalizeByTemplate(value[key], templateValue);
    });
    return normalized;
  }

  if (template === null) return value === null ? null : null;
  if (typeof template === 'number') return typeof value === 'number' ? value : template;
  if (typeof template === 'boolean') return typeof value === 'boolean' ? value : template;
  if (typeof template === 'string') return typeof value === 'string' ? value : template;

  return value;
}

export function extractPortfolioCategories(value: unknown): string[] {
  if (!isObjectValue(value) || !Array.isArray(value.categories)) return [];
  return value.categories.map((item) => String(item)).filter(Boolean);
}

export function resolveAssetUrl(path?: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBase = getApiOrigin();
  return `${apiBase}${path}`;
}

// Deep-merges CMS overrides over the static next-intl messages.
// Objects merge recursively; strings and arrays are replaced wholesale by the
// override. The base is never mutated, and any value missing from the override
// falls through to the static default — so a locale always has complete messages.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Keys that could mutate Object.prototype via bracket assignment. Overrides are
// served from an unauthenticated public endpoint, so we filter these out as
// defense in depth even though the backend policy also rejects them.
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown> | null | undefined,
): T {
  if (!override) return base;

  const result: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    const baseValue = result[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  }

  return result as T;
}

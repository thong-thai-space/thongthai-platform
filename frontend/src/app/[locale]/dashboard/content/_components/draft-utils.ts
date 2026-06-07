// Immutable nested-object helpers for the CMS draft state. The draft mirrors the
// override payload: string leaves, string[] leaves, nested objects.

export type DraftValue = string | string[];
export type DraftNode = { [key: string]: DraftValue | DraftNode };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getIn(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>(
    (acc, key) => (isPlainObject(acc) ? acc[key] : undefined),
    obj,
  );
}

// Returns a new object with `value` set at `path` (parents cloned as needed).
export function setIn(
  obj: Record<string, unknown>,
  path: string[],
  value: DraftValue,
): Record<string, unknown> {
  const [head, ...rest] = path;
  if (rest.length === 0) {
    return { ...obj, [head]: value };
  }
  const child = isPlainObject(obj[head]) ? (obj[head] as Record<string, unknown>) : {};
  return { ...obj, [head]: setIn(child, rest, value) };
}

// Strips empty strings, empty arrays, and empty objects so the saved override only
// contains fields the admin actually set — everything else falls back to defaults.
export function prune(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      if (value.trim() !== '') out[key] = value;
    } else if (Array.isArray(value)) {
      const arr = value.filter(
        (item) => typeof item === 'string' && item.trim() !== '',
      );
      if (arr.length > 0) out[key] = arr;
    } else if (isPlainObject(value)) {
      const child = prune(value);
      if (Object.keys(child).length > 0) out[key] = child;
    }
  }
  return out;
}

// Returns a copy of `obj` with the given dotted paths removed (and empty parent
// objects pruned). Used to keep image fields out of the text draft — images are
// managed separately and shared across locales.
export function omitPaths(
  obj: Record<string, unknown>,
  dottedPaths: string[],
): Record<string, unknown> {
  let result: Record<string, unknown> = JSON.parse(JSON.stringify(obj));
  for (const dotted of dottedPaths) {
    result = removePath(result, dotted.split('.'));
  }
  return result;
}

function removePath(
  node: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const [head, ...rest] = keys;
  if (!(head in node)) return node;
  const clone = { ...node };
  if (rest.length === 0) {
    delete clone[head];
    return clone;
  }
  if (isPlainObject(clone[head])) {
    const updated = removePath(clone[head] as Record<string, unknown>, rest);
    if (Object.keys(updated).length === 0) delete clone[head];
    else clone[head] = updated;
  }
  return clone;
}

// Builds an object containing only the given dotted paths that exist in `obj`.
// Used to preserve image fields when saving/resetting text (PUT replaces the row).
export function pickPaths(
  obj: Record<string, unknown>,
  dottedPaths: string[],
): Record<string, unknown> {
  let result: Record<string, unknown> = {};
  for (const dotted of dottedPaths) {
    const keys = dotted.split('.');
    const value = getIn(obj, keys);
    if (typeof value === 'string' || Array.isArray(value)) {
      result = setIn(result, keys, value as DraftValue);
    }
  }
  return result;
}

// camelCase / single word -> "Title Case" for field labels.
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

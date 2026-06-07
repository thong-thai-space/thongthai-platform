// Pure helpers to set/unset a dotted path inside an override payload object.
// Used by the image flow to write an uploaded URL into the right nested field
// (e.g. "items.web.imageUrl") without disturbing sibling content.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function setAtPath(
  source: Record<string, unknown>,
  dottedPath: string,
  value: string,
): Record<string, unknown> {
  const keys = dottedPath.split('.');
  const root: Record<string, unknown> = { ...source };
  let cursor = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = cursor[key];
    const cloned = isPlainObject(next) ? { ...next } : {};
    cursor[key] = cloned;
    cursor = cloned;
  }
  cursor[keys[keys.length - 1]] = value;
  return root;
}

// Removes the leaf at the dotted path and prunes any parent objects left empty.
export function unsetAtPath(
  source: Record<string, unknown>,
  dottedPath: string,
): Record<string, unknown> {
  const keys = dottedPath.split('.');

  const recurse = (
    node: Record<string, unknown>,
    depth: number,
  ): Record<string, unknown> => {
    const key = keys[depth];
    const clone = { ...node };
    if (depth === keys.length - 1) {
      delete clone[key];
      return clone;
    }
    const child = clone[key];
    if (!isPlainObject(child)) return clone;
    const updated = recurse(child, depth + 1);
    if (Object.keys(updated).length === 0) delete clone[key];
    else clone[key] = updated;
    return clone;
  };

  return recurse(source, 0);
}

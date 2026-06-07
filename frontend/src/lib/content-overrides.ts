import 'server-only';

// Server-side fetch of CMS message overrides for a locale. Resolves the API base
// from env (window-based detection in lib/api.ts isn't available on the server).
function resolveServerApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return 'http://localhost:4000/api/v1';
}

/**
 * Fetches `{ namespace: overrideData }` for the given locale. Always resolves —
 * any failure (backend down, bad response) returns `{}` so the page still renders
 * from its static next-intl messages. `no-store` keeps admin edits visible
 * immediately; the payload is tiny (a handful of rows).
 */
export async function fetchContentOverrides(
  locale: string,
): Promise<Record<string, Record<string, unknown>>> {
  try {
    const res = await fetch(
      `${resolveServerApiBase()}/content/overrides/${locale}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return {};

    const json: unknown = await res.json();
    // Unwrap the API envelope only when it actually looks like one ({ success, data }),
    // matching the Axios interceptor — so a non-envelope object with a `data` field
    // isn't silently mistaken for an envelope.
    const isEnvelope =
      json !== null &&
      typeof json === 'object' &&
      'success' in json &&
      'data' in json;
    const data = isEnvelope ? (json as { data: unknown }).data : json;

    return data && typeof data === 'object'
      ? (data as Record<string, Record<string, unknown>>)
      : {};
  } catch {
    return {};
  }
}

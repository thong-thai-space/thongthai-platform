/**
 * Server-side API fetch for RSC / generateMetadata / generateStaticParams / sitemap
 * contexts — places where the axios client in `lib/api.ts` (and its response
 * unwrapping) is not available.
 *
 * The backend wraps every successful response in a standard envelope
 * `{ success: true, data: <payload>, timestamp }` (see the backend
 * ResponseEnvelopeInterceptor). Raw `fetch()` callers must therefore unwrap
 * `.data` themselves — forgetting this previously crashed the production
 * `/sitemap.xml` prerender (`x.map is not a function`) because the envelope
 * object was treated as an array.
 *
 * Returns `null` on any failure (non-OK status, network error, parse error) so
 * callers can degrade gracefully and never break a build.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000/api/v1";

export async function serverApiGet<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, init);
    if (!res.ok) return null;

    const json: unknown = await res.json();
    // Tolerate both the enveloped shape and a bare payload (defensive).
    const payload =
      json && typeof json === "object" && "data" in json
        ? (json as { data: unknown }).data
        : json;

    return payload as T;
  } catch {
    return null;
  }
}

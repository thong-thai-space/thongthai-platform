const DEFAULT_API_ORIGIN = 'http://localhost:4000';

export function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return DEFAULT_API_ORIGIN;

  try {
    return new URL(apiUrl).origin;
  } catch {
    return DEFAULT_API_ORIGIN;
  }
}

export function resolveBackendAssetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiOrigin()}${normalizedPath}`;
}
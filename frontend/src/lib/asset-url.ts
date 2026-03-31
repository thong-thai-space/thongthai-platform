const DEFAULT_API_ORIGIN = 'http://localhost:4000';
const PRODUCTION_API_ORIGIN = 'https://api.thongthaispace.com';

function resolveConfiguredApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) return null;

  try {
    return new URL(apiUrl).origin;
  } catch {
    return null;
  }
}

function resolveRuntimeApiOrigin() {
  if (typeof window === 'undefined') return null;

  const host = window.location.hostname;
  if (host === 'thongthaispace.com' || host.endsWith('.thongthaispace.com')) {
    return PRODUCTION_API_ORIGIN;
  }

  return null;
}

export function getApiOrigin() {
  return (
    resolveConfiguredApiOrigin() ||
    resolveRuntimeApiOrigin() ||
    DEFAULT_API_ORIGIN
  );
}

function resolveAbsoluteAssetUrl(url: string) {
  try {
    const parsed = new URL(url);
    const isLocalOrigin =
      parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (!isLocalOrigin) {
      return url;
    }

    return `${getApiOrigin()}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function resolveBackendAssetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return resolveAbsoluteAssetUrl(path);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiOrigin()}${normalizedPath}`;
}
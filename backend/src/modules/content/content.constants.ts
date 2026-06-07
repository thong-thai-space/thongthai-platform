// DI token for the repository port (Pattern: Dependency Inversion)
export const CONTENT_REPOSITORY = Symbol('CONTENT_REPOSITORY');

// Locales the CMS can store overrides for — mirrors the frontend next-intl routing.
export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

// Allowlist of editable next-intl namespaces. The CMS only ever overrides these,
// so an admin (or a bad payload) can never inject arbitrary message namespaces.
// Keep in sync with the frontend editor's namespace list.
export const EDITABLE_NAMESPACES = [
  'hero',
  'services',
  'servicesPage',
  'process',
  'testimonials',
  'cta',
  'footer',
  'about',
  'contactPage',
  'portfolio',
  'portfolioPage',
  'blog',
  'nav',
  'meta',
  'aiWidget',
] as const;

// Guard rails for a single namespace override payload.
export const MAX_OVERRIDE_BYTES = 64 * 1024; // 64 KB serialized JSON
export const MAX_OVERRIDE_DEPTH = 6;

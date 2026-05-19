// Pattern: Open/Closed — sections are whitelisted here; add new ones without changing use-cases
export const CONTENT_REPOSITORY = Symbol('CONTENT_REPOSITORY');
export const CONTENT_SECTION_VALIDATOR = Symbol('CONTENT_SECTION_VALIDATOR');

export const KNOWN_CONTENT_SECTIONS = [
  'hero',
  'services',
  'process',
  'testimonials',
  'cta',
  'footer',
  'portfolio',
  'about',
  'servicesPage',
  'contact',
  'header',
  'ai-prompts',
  'ai-ui',
] as const;

export type KnownContentSection = (typeof KNOWN_CONTENT_SECTIONS)[number];

export const MAX_CONTENT_PAYLOAD_BYTES = 256 * 1024; // 256 KB hard cap to guard the DB

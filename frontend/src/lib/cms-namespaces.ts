import en from '../../messages/en.json';
import vi from '../../messages/vi.json';

// Static next-intl catalogs — the shape + default values the editor renders from.
export const STATIC_MESSAGES = { en, vi } as const;

export type EditorLocale = 'vi' | 'en';

// Editable namespaces — MUST stay in sync with the backend EDITABLE_NAMESPACES
// allowlist (content.constants.ts). These are the only namespaces the CMS overrides.
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

export type EditableNamespace = (typeof EDITABLE_NAMESPACES)[number];

export const NAMESPACE_LABELS: Record<EditableNamespace, string> = {
  hero: 'Hero (trang chủ)',
  services: 'Dịch vụ (trang chủ)',
  servicesPage: 'Trang Dịch vụ',
  process: 'Quy trình',
  testimonials: 'Cảm nhận khách hàng',
  cta: 'Kêu gọi hành động (CTA)',
  footer: 'Chân trang (Footer)',
  about: 'Trang Giới thiệu',
  contactPage: 'Trang Liên hệ',
  portfolio: 'Portfolio (trang chủ)',
  portfolioPage: 'Trang Portfolio',
  blog: 'Blog',
  nav: 'Thanh điều hướng',
  meta: 'SEO (meta)',
  aiWidget: 'Widget AI',
};

// Image fields per namespace (dotted paths within the namespace). The editor
// renders these as upload widgets instead of text inputs, and images are shared
// across locales. MUST stay in sync with the backend IMAGE_FIELDS allowlist.
export const IMAGE_FIELDS: Record<string, string[]> = {
  hero: ['imageUrl'],
  about: ['heroImageUrl'],
  services: [
    'items.web.imageUrl',
    'items.mobile.imageUrl',
    'items.ai.imageUrl',
    'items.consulting.imageUrl',
  ],
};

// The default (static) message subtree for a namespace in a given locale.
export function getNamespaceDefaults(
  locale: EditorLocale,
  namespace: EditableNamespace,
): Record<string, unknown> {
  const catalog = STATIC_MESSAGES[locale] as Record<string, unknown>;
  const node = catalog[namespace];
  return node && typeof node === 'object' ? (node as Record<string, unknown>) : {};
}

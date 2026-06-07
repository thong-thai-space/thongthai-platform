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

// The default (static) message subtree for a namespace in a given locale.
export function getNamespaceDefaults(
  locale: EditorLocale,
  namespace: EditableNamespace,
): Record<string, unknown> {
  const catalog = STATIC_MESSAGES[locale] as Record<string, unknown>;
  const node = catalog[namespace];
  return node && typeof node === 'object' ? (node as Record<string, unknown>) : {};
}

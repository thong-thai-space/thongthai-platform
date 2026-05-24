import type { ReactElement } from 'react';

/**
 * Pattern: Renderer — converts a JSON-LD object into a `<script type="application/ld+json">`
 * tag. Keep payloads serializable (no functions, no React nodes). Use a stable `id` per page
 * so each schema is replaced — not duplicated — on client navigation.
 */
function JsonLd({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown> | Record<string, unknown>[];
}): ReactElement {
  return (
    <script
      type="application/ld+json"
      id={id}
      // dangerouslySetInnerHTML is the only way to emit raw JSON-LD without escaping
      // breaking Google's parser. Payloads come from typed builders below, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://thongthaispace.com';

/**
 * Pattern: Builder — Organization schema. Renders once in the root layout.
 * Maps to Google's "Knowledge Panel" rich result.
 */
export function OrganizationJsonLd({ name }: { name: string }) {
  return (
    <JsonLd
      id="ld-organization"
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        sameAs: [],
      }}
    />
  );
}

/**
 * Pattern: Builder — WebSite schema with SearchAction. Enables a sitelinks
 * search box in Google SERPs once a `/search?q=...` route exists.
 */
export function WebSiteJsonLd({ name }: { name: string }) {
  return (
    <JsonLd
      id="ld-website"
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name,
        url: SITE_URL,
        publisher: { '@id': `${SITE_URL}/#organization` },
      }}
    />
  );
}

export type BreadcrumbItem = {
  name: string;
  /** Absolute or root-relative URL (no trailing slash except for `/`). */
  url: string;
};

/**
 * Pattern: Builder — BreadcrumbList schema. Renders inside each landing page.
 * Always include the home node as item 1 so Google can stitch the trail.
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      id="ld-breadcrumbs"
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url.startsWith('http')
            ? item.url
            : `${SITE_URL}${item.url}`,
        })),
      }}
    />
  );
}

/**
 * Pattern: Builder — ContactPage schema for the /contact route.
 */
export function ContactPageJsonLd({
  name,
  url,
  email,
  telephone,
}: {
  name: string;
  url: string;
  email?: string;
  telephone?: string;
}) {
  return (
    <JsonLd
      id="ld-contactpage"
      data={{
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name,
        url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
        publisher: { '@id': `${SITE_URL}/#organization` },
        ...(email || telephone
          ? {
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                ...(email ? { email } : {}),
                ...(telephone ? { telephone } : {}),
                availableLanguage: ['Vietnamese', 'English'],
              },
            }
          : {}),
      }}
    />
  );
}

/**
 * Pattern: Builder — Article schema for a future blog post (PR-7 will use this).
 * Exported now so the JSON-LD module covers all GĐ1 surfaces in one place.
 */
export function ArticleJsonLd({
  headline,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
}: {
  headline: string;
  description?: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
}) {
  return (
    <JsonLd
      id="ld-article"
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        ...(description ? { description } : {}),
        url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
        ...(image
          ? { image: image.startsWith('http') ? image : `${SITE_URL}${image}` }
          : {}),
        datePublished,
        ...(dateModified ? { dateModified } : {}),
        author: { '@type': 'Person', name: authorName },
        publisher: { '@id': `${SITE_URL}/#organization` },
      }}
    />
  );
}

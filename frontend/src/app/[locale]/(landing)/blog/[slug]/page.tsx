import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BlogPostContent } from '@/components/landing/blog-post-content';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { routing } from '@/i18n/routing';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://thongthaispace.com';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:4000/api/v1';

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE_URL}/blog/sitemap`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const slugs = (await res.json()) as Array<{
      locale: string;
      slug: string;
    }>;
    return slugs.map(({ locale, slug }) => ({ locale: locale.toLowerCase(), slug }));
  } catch {
    return [];
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const isDefault = locale === routing.defaultLocale;
  const canonical = isDefault ? `/blog/${slug}` : `/${locale}/blog/${slug}`;

  try {
    const res = await fetch(
      `${API_BASE_URL}/blog/${locale.toUpperCase()}/${slug}`,
      { next: { revalidate: 600 } },
    );
    if (res.ok) {
      const post = (await res.json()) as {
        title: string;
        excerpt?: string;
        coverImageUrl?: string;
        tags?: string[];
        publishedAt?: string;
      };

      return {
        title: `${post.title} | ${t('siteName')}`,
        description: post.excerpt ?? t('blog.description'),
        alternates: {
          canonical,
          languages: Object.fromEntries(
            routing.locales.map((alt) => [
              alt,
              alt === routing.defaultLocale
                ? `/blog/${slug}`
                : `/${alt}/blog/${slug}`,
            ]),
          ),
        },
        openGraph: {
          url: `${SITE_URL}${canonical}`,
          siteName: t('siteName'),
          title: `${post.title} | ${t('siteName')}`,
          description: post.excerpt ?? t('blog.description'),
          type: 'article',
          locale,
          ...(post.publishedAt && {
            publishedTime: post.publishedAt,
          }),
          ...(post.coverImageUrl && {
            images: [{ url: post.coverImageUrl, alt: post.title }],
          }),
        },
        keywords: post.tags,
      };
    }
  } catch {
    // Fallback to generic metadata below
  }

  return {
    title: t('blog.title'),
    description: t('blog.description'),
    alternates: { canonical },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'nav' });
  const isDefault = locale === routing.defaultLocale;
  const home = isDefault ? '/' : `/${locale}`;
  const blogUrl = isDefault ? '/blog' : `/${locale}/blog`;
  const postUrl = isDefault ? `/blog/${slug}` : `/${locale}/blog/${slug}`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: t('home'), url: home },
          { name: t('blog'), url: blogUrl },
          { name: slug, url: postUrl },
        ]}
      />
      <BlogPostContent slug={slug} />
    </>
  );
}

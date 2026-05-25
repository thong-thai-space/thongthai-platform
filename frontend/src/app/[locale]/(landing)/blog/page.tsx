import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BlogListContent } from '@/components/landing/blog-list-content';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { routing } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const isDefault = locale === routing.defaultLocale;
  const canonical = isDefault ? '/blog' : `/${locale}/blog`;

  return {
    title: t('blog.title'),
    description: t('blog.description'),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((alt) => [
          alt,
          alt === routing.defaultLocale ? '/blog' : `/${alt}/blog`,
        ]),
      ),
    },
    openGraph: {
      url: canonical,
      siteName: t('siteName'),
      title: t('blog.title'),
      description: t('blog.description'),
      type: 'website',
      locale,
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'nav' });
  const isDefault = locale === routing.defaultLocale;
  const home = isDefault ? '/' : `/${locale}`;
  const blogUrl = isDefault ? '/blog' : `/${locale}/blog`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: t('home'), url: home },
          { name: t('blog'), url: blogUrl },
        ]}
      />
      <BlogListContent />
    </>
  );
}

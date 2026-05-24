import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PortfolioPageContent } from '@/components/landing/portfolio-page-content';
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
  const canonical = isDefault ? '/portfolio' : `/${locale}/portfolio`;

  return {
    title: t('portfolio.title'),
    description: t('portfolio.description'),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((alt) => [
          alt,
          alt === routing.defaultLocale ? '/portfolio' : `/${alt}/portfolio`,
        ]),
      ),
    },
    openGraph: {
      url: canonical,
      siteName: t('siteName'),
      title: t('portfolio.title'),
      description: t('portfolio.description'),
      type: 'website',
      locale,
    },
  };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'nav' });
  const isDefault = locale === routing.defaultLocale;
  const home = isDefault ? '/' : `/${locale}`;
  const portfolioUrl = isDefault ? '/portfolio' : `/${locale}/portfolio`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: t('home'), url: home },
          { name: t('portfolio'), url: portfolioUrl },
        ]}
      />
      <PortfolioPageContent />
    </>
  );
}

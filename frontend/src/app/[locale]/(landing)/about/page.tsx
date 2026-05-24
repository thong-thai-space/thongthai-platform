import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AboutPageContent } from '@/components/landing/about-page-content';
import { routing } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const isDefault = locale === routing.defaultLocale;
  const canonical = isDefault ? '/about' : `/${locale}/about`;

  return {
    title: t('about.title'),
    description: t('about.description'),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((alt) => [
          alt,
          alt === routing.defaultLocale ? '/about' : `/${alt}/about`,
        ]),
      ),
    },
    openGraph: {
      url: canonical,
      siteName: t('siteName'),
      title: t('about.title'),
      description: t('about.description'),
      type: 'website',
      locale,
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutPageContent />;
}

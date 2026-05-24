import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HomeContent } from '@/components/landing/home-content';
import { routing } from '@/i18n/routing';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://thongthaispace.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const isDefault = locale === routing.defaultLocale;
  const canonical = isDefault ? '/' : `/${locale}`;

  return {
    title: t('home.title'),
    description: t('home.description'),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((alt) => [
          alt,
          alt === routing.defaultLocale ? '/' : `/${alt}`,
        ]),
      ),
    },
    openGraph: {
      url: canonical,
      siteName: t('siteName'),
      title: t('home.title'),
      description: t('home.description'),
      type: 'website',
      locale,
    },
    metadataBase: new URL(SITE_URL),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

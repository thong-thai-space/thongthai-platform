import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ServicesPageContent } from '@/components/landing/services-page-content';
import { routing } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const isDefault = locale === routing.defaultLocale;
  const canonical = isDefault ? '/services' : `/${locale}/services`;

  return {
    title: t('services.title'),
    description: t('services.description'),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((alt) => [
          alt,
          alt === routing.defaultLocale ? '/services' : `/${alt}/services`,
        ]),
      ),
    },
    openGraph: {
      url: canonical,
      siteName: t('siteName'),
      title: t('services.title'),
      description: t('services.description'),
      type: 'website',
      locale,
    },
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ServicesPageContent />;
}

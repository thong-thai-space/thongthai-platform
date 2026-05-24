import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactPageContent } from '@/components/landing/contact-page-content';
import {
  BreadcrumbJsonLd,
  ContactPageJsonLd,
} from '@/components/seo/json-ld';
import { routing } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const isDefault = locale === routing.defaultLocale;
  const canonical = isDefault ? '/contact' : `/${locale}/contact`;

  return {
    title: t('contact.title'),
    description: t('contact.description'),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((alt) => [
          alt,
          alt === routing.defaultLocale ? '/contact' : `/${alt}/contact`,
        ]),
      ),
    },
    openGraph: {
      url: canonical,
      siteName: t('siteName'),
      title: t('contact.title'),
      description: t('contact.description'),
      type: 'website',
      locale,
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const tMeta = await getTranslations({ locale, namespace: 'meta' });
  const isDefault = locale === routing.defaultLocale;
  const home = isDefault ? '/' : `/${locale}`;
  const contactUrl = isDefault ? '/contact' : `/${locale}/contact`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: tNav('home'), url: home },
          { name: tNav('contact'), url: contactUrl },
        ]}
      />
      <ContactPageJsonLd
        name={tMeta('contact.title')}
        url={contactUrl}
        email="hoangthai229@gmail.com"
        telephone="+84345807906"
      />
      <ContactPageContent />
    </>
  );
}

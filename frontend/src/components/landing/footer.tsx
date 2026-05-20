'use client';

import { Mail, Phone, MapPin } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

type FooterLink = { href: string; label: string };
type FooterShape = {
  brand?: {
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  links?: Record<string, FooterLink[]>;
};

export function Footer() {
  const { data } = useSectionContent('footer');
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tServices = useTranslations('services.items');
  const cms = (data?.data as FooterShape) || {};

  const brand = {
    name: cms.brand?.name ?? 'Thong Thai Space',
    description: cms.brand?.description ?? t('description'),
    email: cms.brand?.email ?? 'hoangthai229@gmail.com',
    phone: cms.brand?.phone ?? '0345807906',
    address: cms.brand?.address ?? 'Ho Chi Minh City, Vietnam',
  };

  const links: Record<string, FooterLink[]> = cms.links ?? {
    [t('columns.services')]: [
      { href: '/services#web', label: tServices('web.title') },
      { href: '/services#app', label: tServices('mobile.title') },
      { href: '/services#ai', label: tServices('ai.title') },
      { href: '/services#consulting', label: tServices('consulting.title') },
    ],
    [t('columns.company')]: [
      { href: '/about', label: tNav('about') },
      { href: '/portfolio', label: tNav('portfolio') },
      { href: '/contact', label: tNav('contact') },
    ],
    [t('columns.support')]: [
      { href: '/login', label: tNav('signIn') },
      { href: '/register', label: 'Sign up' },
    ],
  };

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="tts-brand-surface grid gap-8 p-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center">
              <span className="text-lg font-bold">
                {brand.name.replace(' Space', '')}<span className="text-primary"> Space</span>
              </span>
            </Link>
            <p className="tts-brand-body mt-3 text-sm">
              {brand.description}
            </p>
            <div className="tts-brand-body mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{brand.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{brand.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{brand.address}</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, columnLinks]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-3 space-y-2">
                {columnLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="tts-brand-body text-sm transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {brand.name}. {t('rights')}
        </div>
      </div>
    </footer>
  );
}

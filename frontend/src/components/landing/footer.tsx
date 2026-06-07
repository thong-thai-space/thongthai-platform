'use client';

import { Mail, Phone, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

type FooterLink = { href: string; label: string };

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tMeta = useTranslations('meta');
  const tServices = useTranslations('services.items');

  const brand = {
    name: tMeta('siteName'),
    description: t('description'),
    email: 'hoangthai229@gmail.com',
    phone: '0345807906',
    address: 'Ho Chi Minh City, Vietnam',
  };

  const links: Record<string, FooterLink[]> = {
    [t('columns.services')]: [
      { href: '/#services', label: tServices('web.title') },
      { href: '/#services', label: tServices('mobile.title') },
      { href: '/#services', label: tServices('ai.title') },
      { href: '/#services', label: tServices('consulting.title') },
    ],
    [t('columns.company')]: [
      { href: '/about', label: tNav('about') },
      { href: '/#portfolio', label: tNav('portfolio') },
      { href: '/#blog', label: tNav('blog') },
      { href: '/contact', label: tNav('contact') },
    ],
    [t('columns.support')]: [
      { href: '/login', label: tNav('signIn') },
      { href: '/register', label: tNav('signUp') },
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
                  <li key={`${link.href}-${link.label}`}>
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

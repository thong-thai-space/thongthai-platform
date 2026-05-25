'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useSectionContent } from '@/hooks/use-content';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

type HeaderContent = {
  navLinks?: Array<{ href: string; label: string }>;
  ctaText?: string;
  signInText?: string;
};

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { data } = useSectionContent('header');
  const t = useTranslations('nav');

  // CMS content (if present) wins over i18n defaults; i18n covers the rest.
  const cms = (data?.data as HeaderContent) || {};
  const navLinks = cms.navLinks?.length
    ? cms.navLinks
    : [
        { href: '/', label: t('home') },
        { href: '/about', label: t('about') },
        { href: '/services', label: t('services') },
        { href: '/portfolio', label: t('portfolio') },
        { href: '/blog', label: t('blog') },
        { href: '/contact', label: t('contact') },
      ];
  const signInText = cms.signInText || t('signIn');
  const ctaText = cms.ctaText || t('cta');

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/72 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/66">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {/* <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_color-mix(in_srgb,var(--primary)_45%,transparent)]" /> */}
          <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Thong Thai <span className="text-primary">Space</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/84 px-2 py-1 shadow-sm backdrop-blur-sm md:flex dark:border-white/10 dark:bg-white/5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <Link
              href={
                user.role === 'CLIENT'
                  ? '/portal'
                  : user.role === 'MEMBER'
                    ? '/member'
                    : '/dashboard/ai-assistant'
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {user.role === 'CLIENT'
                ? t('clientPortal')
                : user.role === 'MEMBER'
                  ? t('memberPortal')
                  : t('dashboard')}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {signInText}
              </Link>
              <Link
                href="/contact"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_color-mix(in_srgb,var(--primary)_35%,transparent)] transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                {ctaText}
              </Link>
            </>
          )}
        </div>

        {/* Mobile right cluster: always-visible toggles + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t('menu')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-t border-slate-200/70 transition-all duration-300 md:hidden dark:border-white/10',
          mobileOpen ? 'max-h-96' : 'max-h-0 border-t-0',
        )}
      >
        <div className="space-y-1 bg-white/90 px-4 py-3 backdrop-blur-md dark:bg-slate-950/90">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-slate-200 pt-3 dark:border-white/10">
            {user ? (
              <Link
                href={
                  user.role === 'CLIENT'
                    ? '/portal'
                    : user.role === 'MEMBER'
                      ? '/member'
                      : '/dashboard/ai-assistant'
                }
                className="block rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                {user.role === 'CLIENT'
                  ? t('clientPortal')
                  : user.role === 'MEMBER'
                    ? t('memberPortal')
                    : t('dashboard')}
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="block rounded-lg border border-border px-4 py-2 text-center text-sm font-medium"
                >
                  {signInText}
                </Link>
                <Link
                  href="/contact"
                  className="block rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
                >
                  {ctaText}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSectionContent } from '@/hooks/use-content';

type HeaderContent = {
  navLinks: Array<{ href: string; label: string }>;
  ctaText: string;
  signInText: string;
};

const defaultHeader: HeaderContent = {
  navLinks: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/contact', label: 'Contact' },
  ],
  ctaText: 'Get in touch',
  signInText: 'Sign in',
};

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loginWithGoogle } = useAuth();
  const { data } = useSectionContent('header');
  const c = (data?.data as HeaderContent) || defaultHeader;
  const navLinks = c.navLinks?.length ? c.navLinks : defaultHeader.navLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold tracking-tight">
            Thong Thai<span className="text-primary"> Space</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
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
              {user.role === 'CLIENT' ? 'Portal' : user.role === 'MEMBER' ? 'My Portal' : 'Dashboard'}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {c.signInText || defaultHeader.signInText}
              </Link>
              <Link
                href="/contact"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {c.ctaText || defaultHeader.ctaText}
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-t border-border transition-all duration-300 md:hidden',
          mobileOpen ? 'max-h-96' : 'max-h-0 border-t-0',
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border pt-3">
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
                {user.role === 'CLIENT' ? 'Portal' : user.role === 'MEMBER' ? 'My Portal' : 'Dashboard'}
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                
                <Link
                  href="/login"
                  className="block rounded-lg border border-border px-4 py-2 text-center text-sm font-medium"
                >
                  {c.signInText || defaultHeader.signInText}
                </Link>
                <Link
                  href="/contact"
                  className="block rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
                >
                  {c.ctaText || defaultHeader.ctaText}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

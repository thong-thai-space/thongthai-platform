'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { BrandLogo } from '@/components/shared/brand-logo';

const defaults = {
  brand: {
    name: 'Thong Thai Space',
    description:
      'Smart technology solutions for businesses. Specializing in Web, App, AI development and IT consulting.',
    email: 'hoangthai229@gmail.com',
    phone: '0345807906',
    address: 'Ho Chi Minh City, Vietnam',
  },
  links: {
    Services: [
      { href: '/services#web', label: 'Web Development' },
      { href: '/services#app', label: 'Mobile Apps' },
      { href: '/services#ai', label: 'AI Solutions' },
      { href: '/services#consulting', label: 'IT Consulting' },
    ],
    Company: [
      { href: '/about', label: 'About' },
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/contact', label: 'Contact' },
    ],
    Support: [
      { href: '/login', label: 'Sign in' },
      { href: '/register', label: 'Sign up' },
    ],
  } as Record<string, { href: string; label: string }[]>,
};

export function Footer() {
  const { data } = useSectionContent('footer');
  const c = (data?.data as typeof defaults) || defaults;

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <BrandLogo
              href="/"
              imageClassName="h-7 max-w-32"
              labelClassName="text-lg font-bold"
              label={c.brand.name}
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {c.brand.description}
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{c.brand.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{c.brand.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{c.brand.address}</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(c.links).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
          &copy; {new Date().getFullYear()} {c.brand.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

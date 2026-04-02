'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';

const defaults = {
  badge: 'Smart technology solutions',
  title: 'Turn ideas into',
  titleHighlight: 'outstanding digital',
  titleEnd: 'products',
  subtitle:
    'Thong Thai Space specializes in Web & App development, AI integration, and IT consulting. Our expert team helps businesses digitize processes and achieve sustainable growth.',
  primaryCta: { text: 'Get a free quote', href: '/contact' },
  secondaryCta: { text: 'View our projects', href: '/portfolio' },
  stats: [
    { value: '50+', label: 'Projects completed' },
    { value: '30+', label: 'Trusted clients' },
    { value: '5+', label: 'Years of experience' },
    { value: '99%', label: 'Client satisfaction' },
  ],
};

export function HeroSection() {
  const { data } = useSectionContent('hero');
  const raw = (data?.data as Partial<typeof defaults>) || {};
  const c = {
    ...defaults,
    ...raw,
    primaryCta: { ...defaults.primaryCta, ...raw.primaryCta },
    secondaryCta: { ...defaults.secondaryCta, ...raw.secondaryCta },
    stats: raw.stats?.length ? raw.stats : defaults.stats,
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src="/videos/video_abdeaea5-859e-4b99-8330-da037fe439e8.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" style={{ zIndex: 1 }} />

      {/* Background decoration (alternative fallback) */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 0 }}>
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl opacity-30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36" style={{ zIndex: 10 }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            {c.badge}
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {c.title}{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {c.titleHighlight}
            </span>{' '}
            {c.titleEnd}
          </h1>

          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            {c.subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={c.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
            >
              {c.primaryCta.text}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={c.secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              {c.secondaryCta.text}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {c.stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-primary sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

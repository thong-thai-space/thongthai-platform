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
    <section className="bg-gradient-to-br from-background via-background to-primary/5">
      {/* Video block */}
      <div className="relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-[28vh] w-full object-cover sm:h-[32vh] lg:h-[36vh]"
        >
          <source src="/videos/video_abdeaea5-859e-4b99-8330-da037fe439e8.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
      </div>

      {/* Hero content card block */}
      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="max-w-3xl rounded-2xl border border-white/15 bg-slate-950/35 p-4 text-center shadow-2xl backdrop-blur-md sm:p-5 lg:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:text-sm">
            <Sparkles className="h-4 w-4" />
            {c.badge}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {c.title}{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {c.titleHighlight}
            </span>{' '}
            {c.titleEnd}
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-200 sm:text-lg">
            {c.subtitle}
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href={c.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
            >
              {c.primaryCta.text}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={c.secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              {c.secondaryCta.text}
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {c.stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-xl font-bold text-primary sm:text-2xl">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-xs text-slate-200 sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

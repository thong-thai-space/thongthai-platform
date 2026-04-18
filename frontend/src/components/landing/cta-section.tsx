'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { MotionReveal, MotionSection } from '@/components/motion/motion-primitives';

const defaults = {
  title: 'Ready to start your project?',
  subtitle:
    'Contact us now for a free consultation and detailed quote for your project. Our expert team will respond within 24 hours.',
  primaryCta: { text: 'Get a quote', href: '/contact' },
  secondaryCta: { text: 'Explore services', href: '/services' },
};

export function CtaSection() {
  const { data } = useSectionContent('cta');
  const c = (data?.data as typeof defaults) || defaults;

  return (
    <MotionSection className="tts-landing-section relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-sky-100/60 to-amber-100/40 dark:from-primary/20 dark:via-slate-900 dark:to-amber-500/10" />
      <MotionReveal className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-12 dark:border-white/10 dark:bg-slate-950/55">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <h2 className="tts-landing-title mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {c.title}
          </h2>
          <p className="tts-landing-subtitle mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {c.subtitle}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={c.primaryCta.href}
              className="tts-conversion-soft inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-[0_14px_36px_color-mix(in_srgb,var(--primary)_34%,transparent)] transition-all hover:-translate-y-0.5 hover:bg-primary/90"
            >
              {c.primaryCta.text}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={c.secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {c.secondaryCta.text}
            </Link>
          </div>
        </div>
      </MotionReveal>
    </MotionSection>
  );
}

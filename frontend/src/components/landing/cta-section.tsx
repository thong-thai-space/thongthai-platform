'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { MotionReveal, MotionSection } from '@/components/motion/motion-primitives';

export function CtaSection() {
  const t = useTranslations('cta');

  const c = {
    title: t('title'),
    subtitle: t('subtitle'),
    primaryCta: { text: t('primary'), href: '/contact' },
    secondaryCta: { text: t('secondary'), href: '/services' },
  };

  return (
    <MotionSection className="tts-landing-section relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-sky-100/60 to-amber-100/40 dark:from-primary/20 dark:via-slate-900 dark:to-amber-500/10" />
      <MotionReveal className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div className="tts-brand-surface tts-brand-grid rounded-3xl p-8 sm:p-12">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <h2 className="tts-landing-title mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {c.title}
          </h2>
          <p className="tts-landing-subtitle tts-brand-body mx-auto mt-4 max-w-2xl text-lg">
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

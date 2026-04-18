'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { MotionReveal } from '@/components/motion/motion-primitives';

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
    <section className="bg-primary py-20 sm:py-28">
      <MotionReveal className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Sparkles className="mx-auto h-10 w-10 text-primary-foreground/80" />
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          {c.title}
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/80">
          {c.subtitle}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={c.primaryCta.href}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-primary shadow-lg transition-all hover:bg-white/90"
          >
            {c.primaryCta.text}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={c.secondaryCta.href}
            className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            {c.secondaryCta.text}
          </Link>
        </div>
      </MotionReveal>
    </section>
  );
}

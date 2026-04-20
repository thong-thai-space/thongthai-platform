'use client';

import { Star } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { MotionCard, MotionReveal, MotionSection } from '@/components/motion/motion-primitives';

const defaults = {
  title: 'What our clients say',
  subtitle: 'Feedback from clients who have trusted and partnered with us',
  items: [
    {
      name: 'Nguyen Minh Tuan',
      role: 'CEO, TechStart Vietnam',
      content:
        'Thong Thai Space helped us build a SaaS platform from scratch. The team is very professional, communicates well and always delivers on schedule.',
      rating: 5,
    },
    {
      name: 'Tran Thu Ha',
      role: 'Founder, BeautyBox',
      content:
        'Our e-commerce website revenue increased 300% after being redesigned by Thong Thai. Beautiful UI, fast performance, and our customers love it.',
      rating: 5,
    },
    {
      name: 'Le Duc Anh',
      role: 'CTO, LogiCorp',
      content:
        'The AI analytics solution helped us optimize 40% of shipping costs. Very impressed with the technical capabilities and problem-solving approach of the team.',
      rating: 5,
    },
  ],
};

export function TestimonialsSection() {
  const { data } = useSectionContent('testimonials');
  const c = (data?.data as typeof defaults) || defaults;

  return (
    <MotionSection className="tts-landing-section relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-6 bottom-6 h-64 w-64 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-500/10" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionReveal className="mx-auto max-w-2xl text-center">
          <h2 className="tts-landing-title text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {c.title}
          </h2>
          <p className="tts-landing-subtitle mt-4 text-lg text-slate-600 dark:text-slate-300">
            {c.subtitle}
          </p>
        </MotionReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {c.items.map((t, index) => (
            <MotionCard
              key={t.name}
              delay={index * 0.08}
              className="tts-brand-surface rounded-2xl p-6"
            >
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-accent text-accent"
                  />
                ))}
              </div>
              <p className="tts-brand-body mt-4 text-sm leading-relaxed">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-white/10">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-300">{t.role}</div>
              </div>
            </MotionCard>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}

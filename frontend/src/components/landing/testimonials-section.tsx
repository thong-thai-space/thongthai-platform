'use client';

import { Star } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';

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
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {c.subtitle}
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {c.items.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-border bg-background p-6"
            >
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-accent text-accent"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="mt-4 border-t border-border pt-4">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

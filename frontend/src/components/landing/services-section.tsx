'use client';

/* eslint-disable @next/next/no-img-element */
import { Globe, Smartphone, Brain, MessageSquare } from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import { MotionCard, MotionReveal, MotionSection } from '@/components/motion/motion-primitives';

// Pattern: Registry (icon name string → component, resolved at render time)
const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Globe,
  Smartphone,
  Brain,
  MessageSquare,
};

type ServiceItem = {
  icon: string;
  title: string;
  description: string;
  features: string[];
  imageUrl?: string;
};

// Stable keys for the i18n-driven service items.
const I18N_ITEM_KEYS = ['web', 'mobile', 'ai', 'consulting'] as const;
const I18N_ICONS: Record<(typeof I18N_ITEM_KEYS)[number], string> = {
  web: 'Globe',
  mobile: 'Smartphone',
  ai: 'Brain',
  consulting: 'MessageSquare',
};

export function ServicesSection() {
  const t = useTranslations('services');

  const title = t('title');
  const subtitle = t('subtitle');
  const items: ServiceItem[] = I18N_ITEM_KEYS.map((key) => ({
    icon: I18N_ICONS[key],
    title: t(`items.${key}.title`),
    description: t(`items.${key}.description`),
    features: t.raw(`items.${key}.features`) as string[],
  }));

  return (
    <MotionSection id="services" className="tts-landing-section relative overflow-hidden bg-linear-to-b from-white to-slate-50 py-20 sm:py-28 dark:from-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <MotionReveal className="mx-auto max-w-2xl text-center">
          <h2 className="tts-landing-title text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {title}
          </h2>
          <p className="tts-landing-subtitle mt-4 text-lg text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
        </MotionReveal>

        <div className="mt-16 flex flex-col gap-4">
          {items.map((service, index) => {
            const Icon = iconMap[service.icon] ?? Globe;
            const imageSrc = service.imageUrl
              ? resolveBackendAssetUrl(service.imageUrl) || service.imageUrl
              : undefined;
            return (
              <MotionCard
                key={service.title}
                delay={0.06 * index}
                className="group flex items-start gap-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:border-primary/35 hover:shadow-[0_8px_30px_-8px_rgba(37,99,235,0.25)] dark:border-slate-700/60 dark:bg-slate-900"
              >
                <div className="flex-shrink-0">
                  {imageSrc ? (
                    <div className="h-14 w-14 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800">
                      <img
                        src={imageSrc}
                        alt={service.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{service.title}</h3>
                  <p className="tts-brand-body mt-1 text-sm">{service.description}</p>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {service.features.map((f) => (
                      <li key={f} className="tts-brand-body flex items-center gap-1.5 text-sm">
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </MotionCard>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
}
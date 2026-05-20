'use client';

import { MessageSquare, Lightbulb, Code, Rocket } from 'lucide-react';
import type { ComponentType } from 'react';
import { useSectionContent } from '@/hooks/use-content';
import { useTranslations } from 'next-intl';
import { MotionReveal, MotionSection } from '@/components/motion/motion-primitives';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  MessageSquare,
  Lightbulb,
  Code,
  Rocket,
};

type ProcessStep = { icon: string; step: string; title: string; description: string };
type ProcessShape = { title?: string; subtitle?: string; steps?: ProcessStep[] };

const I18N_STEP_KEYS = ['discuss', 'design', 'develop', 'deploy'] as const;
const I18N_STEP_ICONS: Record<(typeof I18N_STEP_KEYS)[number], string> = {
  discuss: 'MessageSquare',
  design: 'Lightbulb',
  develop: 'Code',
  deploy: 'Rocket',
};

export function ProcessSection() {
  const { data } = useSectionContent('process');
  const t = useTranslations('process');
  const cms = (data?.data as ProcessShape) || {};

  const title = cms.title ?? t('title');
  const subtitle = cms.subtitle ?? t('subtitle');
  const steps: ProcessStep[] =
    cms.steps?.length
      ? cms.steps
      : I18N_STEP_KEYS.map((key, index) => ({
          icon: I18N_STEP_ICONS[key],
          step: String(index + 1).padStart(2, '0'),
          title: t(`steps.${key}.title`),
          description: t(`steps.${key}.description`),
        }));

  return (
    <MotionSection className="tts-landing-section relative overflow-hidden bg-linear-to-b from-slate-50 to-white py-20 sm:py-28 dark:from-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-10 top-16 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-500/10" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionReveal className="mx-auto max-w-2xl text-center">
          <h2 className="tts-landing-title text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {title}
          </h2>
          <p className="tts-landing-subtitle mt-4 text-lg text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
        </MotionReveal>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, idx) => {
            const Icon = iconMap[item.icon];
            return (
              <MotionReveal key={item.step} delay={idx * 0.08} className="relative">
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className="absolute left-[55%] top-10 hidden h-0.5 w-full bg-linear-to-r from-primary/35 to-transparent lg:block" />
                )}

                <div className="tts-brand-surface rounded-2xl p-5">
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                    {Icon && <Icon className="h-6 w-6" />}
                  </div>
                  <div className="mt-3 text-center text-xs font-bold tracking-wide text-primary">{item.step}</div>
                  <h3 className="mt-2 text-center text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="tts-brand-body mt-2 text-center text-sm">{item.description}</p>
                </div>
              </MotionReveal>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
}

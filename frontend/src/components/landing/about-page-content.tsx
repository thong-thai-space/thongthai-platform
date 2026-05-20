/* eslint-disable @next/next/no-img-element */
'use client';

import { Award, Heart, Target, Users } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { useTranslations } from 'next-intl';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import type { ComponentType } from 'react';
import {
  BrandContainer,
  BrandHeroContainer,
  BrandSection,
  BrandSurface,
} from '@/components/brand/brand-primitives';

// Pattern: Registry (icon name string → component, resolved at render time)
const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Target,
  Users,
  Heart,
  Award,
};

type AboutValue = { icon: string; title: string; description: string };
type AboutTeamMember = { name: string; role: string; bio: string; avatar?: string };
type AboutShape = {
  hero?: { title?: string; subtitle?: string };
  valuesTitle?: string;
  values?: AboutValue[];
  teamTitle?: string;
  teamSubtitle?: string;
  team?: AboutTeamMember[];
};

const I18N_VALUE_KEYS = ['quality', 'partnership', 'dedication', 'innovation'] as const;
const I18N_VALUE_ICONS: Record<(typeof I18N_VALUE_KEYS)[number], string> = {
  quality: 'Target',
  partnership: 'Users',
  dedication: 'Heart',
  innovation: 'Award',
};

export function AboutPageContent() {
  const { data } = useSectionContent('about');
  const t = useTranslations('about');
  const cms = (data?.data as AboutShape) || {};

  // Pattern: Chain of Responsibility (CMS payload → i18n translations → compile-time fallback)
  const c = {
    hero: {
      title: cms.hero?.title ?? t('heroTitle'),
      subtitle: cms.hero?.subtitle ?? t('heroSubtitle'),
    },
    valuesTitle: cms.valuesTitle ?? t('valuesTitle'),
    values:
      cms.values?.length
        ? cms.values
        : I18N_VALUE_KEYS.map((key) => ({
            icon: I18N_VALUE_ICONS[key],
            title: t(`values.${key}.title`),
            description: t(`values.${key}.description`),
          })),
    teamTitle: cms.teamTitle ?? t('teamTitle'),
    teamSubtitle: cms.teamSubtitle ?? t('teamSubtitle'),
    team: cms.team ?? [],
  };

  return (
    <div>
      <BrandSection className="tts-brand-grid bg-linear-to-br from-background via-background to-primary/5">
        <BrandHeroContainer>
          <h1 className="tts-landing-display text-4xl font-bold tracking-tight sm:text-5xl">
            {c.hero.title}
          </h1>
          <p className="tts-brand-body mt-6 text-lg leading-8">{c.hero.subtitle}</p>
        </BrandHeroContainer>
      </BrandSection>

      <BrandSection>
        <BrandContainer>
          <h2 className="tts-landing-title text-center text-3xl font-bold">{c.valuesTitle}</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {c.values.map((v) => {
              const Icon = iconMap[v.icon] || Target;
              return (
                <BrandSurface key={v.title} className="p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                  <p className="tts-brand-body mt-2 text-sm">{v.description}</p>
                </BrandSurface>
              );
            })}
          </div>
        </BrandContainer>
      </BrandSection>

      <BrandSection className="bg-muted/30">
        <BrandContainer>
          <h2 className="tts-landing-title text-center text-3xl font-bold">{c.teamTitle}</h2>
          <p className="tts-brand-body mt-4 text-center">{c.teamSubtitle}</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {c.team.map((member, index) => (
              <BrandSurface
                key={`${member.name}-${index}`}
                className="p-6 text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {member.avatar ? (
                    <img
                      src={resolveAssetUrl(member.avatar)}
                      alt={member.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
                <div className="text-sm text-primary">{member.role}</div>
                <p className="tts-brand-body mt-2 text-sm">{member.bio}</p>
              </BrandSurface>
            ))}
          </div>
        </BrandContainer>
      </BrandSection>
    </div>
  );
}

function resolveAssetUrl(path?: string) {
  if (!path) return '';
  return resolveBackendAssetUrl(path) || '';
}

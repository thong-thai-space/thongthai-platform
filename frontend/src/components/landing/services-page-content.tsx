'use client';

/* eslint-disable @next/next/no-img-element */
import {
  ArrowRight,
  Brain,
  Check,
  Globe,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
  Globe,
  Smartphone,
  Brain,
  MessageSquare,
};

type ServicePageItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
  techStack: string[];
  imageUrl?: string;
};

// Stable keys for the i18n fallback. Tech stacks are not translated.
const I18N_PAGE_KEYS = ['web', 'mobile', 'ai', 'consulting'] as const;
const I18N_PAGE_META: Record<
  (typeof I18N_PAGE_KEYS)[number],
  { id: string; icon: string; techStack: string[] }
> = {
  web: { id: 'web', icon: 'Globe', techStack: ['Next.js', 'React', 'Node.js', 'NestJS', 'PostgreSQL', 'Redis'] },
  mobile: { id: 'app', icon: 'Smartphone', techStack: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'] },
  ai: { id: 'ai', icon: 'Brain', techStack: ['OpenAI', 'Anthropic Claude', 'LangChain', 'Python', 'TensorFlow'] },
  consulting: { id: 'consulting', icon: 'MessageSquare', techStack: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Monitoring'] },
};

export function ServicesPageContent() {
  const { data: servicesData } = useSectionContent('services');
  const { data: pageData } = useSectionContent('servicesPage');
  const t = useTranslations('servicesPage');
  const tItems = useTranslations('servicesPage.items');

  const cmsItems = (servicesData?.data as { items?: ServicePageItem[] } | undefined)?.items;
  const services: ServicePageItem[] = cmsItems?.length
    ? cmsItems
    : I18N_PAGE_KEYS.map((key) => ({
        ...I18N_PAGE_META[key],
        title: tItems(`${key}.title`),
        description: tItems(`${key}.description`),
        features: tItems.raw(`${key}.features`) as string[],
      }));

  // Pattern: Chain of Responsibility (CMS payload → i18n translations → compile-time fallback)
  const rawPage = (pageData?.data as Partial<{
    hero: { title?: string; titleHighlight?: string; subtitle?: string };
    cta: { title?: string; subtitle?: string; buttonText?: string; buttonHref?: string };
  }>) || {};
  const c = {
    hero: {
      title: rawPage.hero?.title ?? t('heroTitle'),
      titleHighlight: rawPage.hero?.titleHighlight ?? t('heroTitleHighlight'),
      subtitle: rawPage.hero?.subtitle ?? t('heroSubtitle'),
    },
    cta: {
      title: rawPage.cta?.title ?? t('ctaTitle'),
      subtitle: rawPage.cta?.subtitle ?? t('ctaSubtitle'),
      buttonText: rawPage.cta?.buttonText ?? t('ctaButton'),
      buttonHref: rawPage.cta?.buttonHref ?? '/contact',
    },
  };

  const titleParts =
    c.hero.titleHighlight && c.hero.title.includes(c.hero.titleHighlight)
      ? c.hero.title.split(c.hero.titleHighlight)
      : null;

  return (
    <div>
      <BrandSection className="tts-brand-grid bg-linear-to-br from-background via-background to-primary/5">
        <BrandHeroContainer>
          <h1 className="tts-landing-display text-4xl font-bold tracking-tight sm:text-5xl">
            {titleParts ? (
              <>
                {titleParts[0]}
                <span className="text-primary">{c.hero.titleHighlight}</span>
                {titleParts[1]}
              </>
            ) : (
              c.hero.title
            )}
          </h1>
          <p className="tts-brand-body mt-6 text-lg leading-8">{c.hero.subtitle}</p>
        </BrandHeroContainer>
      </BrandSection>

      <BrandSection>
        <BrandContainer>
          <div className="space-y-20">
            {services.map((service, idx) => {
              const Icon = iconMap[service.icon] || Globe;
              const imageSrc = service.imageUrl
                ? resolveBackendAssetUrl(service.imageUrl) || service.imageUrl
                : undefined;
              return (
                <div
                  key={service.id || service.title}
                  id={service.id || service.title.toLowerCase().replace(/\s+/g, '-')}
                  className={`flex flex-col gap-12 lg:flex-row lg:items-center ${
                    idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <BrandSurface className="flex-1 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h2 className="text-2xl font-bold">{service.title}</h2>
                    </div>
                    <p className="tts-brand-body mt-4">{service.description}</p>
                    <ul className="mt-6 space-y-2">
                      {service.features?.map((f) => (
                        <li key={f} className="tts-brand-body flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {service.techStack?.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </BrandSurface>

                  <BrandSurface
                    className={`flex flex-1 items-center justify-center overflow-hidden ${
                      imageSrc ? 'p-0' : 'tts-brand-grid p-12'
                    }`}
                  >
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={service.title}
                        className="h-72 w-full object-cover lg:h-80"
                      />
                    ) : (
                      <Icon className="h-24 w-24 text-primary/20" />
                    )}
                  </BrandSurface>
                </div>
              );
            })}
          </div>
        </BrandContainer>
      </BrandSection>

      <BrandSection className="bg-primary py-16">
        <BrandHeroContainer>
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">{c.cta.title}</h2>
          <p className="mt-3 text-primary-foreground/80">{c.cta.subtitle}</p>
          <Link
            href={c.cta.buttonHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-white/90"
          >
            {c.cta.buttonText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </BrandHeroContainer>
      </BrandSection>
    </div>
  );
}

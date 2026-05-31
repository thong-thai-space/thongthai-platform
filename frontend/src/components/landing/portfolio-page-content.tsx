/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSectionContent } from '@/hooks/use-content';
import { useShowcaseProjects } from '@/hooks/use-projects';
import type { Project } from '@/types';
import { useMemo, useState } from 'react';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import {
  BrandContainer,
  BrandHeroContainer,
  BrandSection,
  BrandSurface,
} from '@/components/brand/brand-primitives';

type PortfolioContent = {
  hero: {
    title: string;
    titleHighlight: string;
    subtitle: string;
  };
  categories: string[];
  items: Array<{
    title: string;
    client: string;
    category: string;
    description: string;
    techStack: string[];
    results: string;
  }>;
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonHref: string;
  };
};

type PortfolioDisplayItem = {
  title: string;
  client: string;
  category: string;
  description: string;
  techStack: string[];
  results: string;
  thumbnailUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  figmaUrl?: string;
};

const ALL_CATEGORY = 'All';

export function PortfolioPageContent() {
  const t = useTranslations('portfolioPage');
  const { data } = useSectionContent('portfolio');
  const { data: showcaseProjects = [] } = useShowcaseProjects();

  // i18n defaults; the CMS `portfolio` section may override hero/cta per locale.
  // `items`/`categories` are derived from showcase projects below, so the defaults
  // only need to carry hero + cta.
  const defaults: PortfolioContent = {
    hero: {
      title: t('heroTitle'),
      titleHighlight: t('heroTitleHighlight'),
      subtitle: t('heroSubtitle'),
    },
    categories: [ALL_CATEGORY],
    items: [],
    cta: {
      title: t('ctaTitle'),
      subtitle: t('ctaSubtitle'),
      buttonText: t('ctaButton'),
      buttonHref: '/contact',
    },
  };

  const raw = (data?.data as Partial<PortfolioContent>) || {};
  const content: PortfolioContent = {
    ...defaults,
    ...raw,
    hero: { ...defaults.hero, ...raw.hero },
    cta: { ...defaults.cta, ...raw.cta },
  };

  const dbItems = useMemo<PortfolioDisplayItem[]>(() => showcaseProjects.map(mapProjectToPortfolioItem), [showcaseProjects]);
  const items: PortfolioDisplayItem[] = dbItems;
  const categories = useMemo(() => {
    if (dbItems.length === 0) return [ALL_CATEGORY];

    const unique = Array.from(new Set(dbItems.map((item) => item.category).filter(Boolean)));
    return [ALL_CATEGORY, ...unique];
  }, [dbItems]);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);

  const filteredItems = useMemo(
    () => items.filter((item) => activeCategory === 'All' || item.category === activeCategory),
    [activeCategory, items],
  );

  return (
    <div>
      <BrandSection className="tts-brand-grid bg-linear-to-br from-background via-background to-primary/5">
        <BrandHeroContainer>
          <h1 className="tts-landing-display text-4xl font-bold tracking-tight sm:text-5xl">
            {content.hero.titleHighlight ? (
              <>
                {content.hero.title.replace(content.hero.titleHighlight, '').trim()}{' '}
                <span className="text-primary">{content.hero.titleHighlight}</span>
              </>
            ) : (
              content.hero.title
            )}
          </h1>
          <p className="tts-brand-body mt-6 text-lg leading-8">{content.hero.subtitle}</p>
        </BrandHeroContainer>
      </BrandSection>

      <section className="border-b border-border bg-muted/20">
        <BrandContainer>
          <div className="flex gap-6 overflow-x-auto py-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'rounded-full bg-primary/10 px-3 py-1 text-primary'
                    : 'rounded-full px-3 py-1 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat === ALL_CATEGORY ? t('categoryAll') : cat}
              </button>
            ))}
          </div>
        </BrandContainer>
      </section>

      <BrandSection>
        <BrandContainer>
          {filteredItems.length === 0 ? (
            <BrandSurface className="rounded-xl border-dashed p-10 text-center">
              <p className="tts-brand-body text-sm">{t('empty')}</p>
            </BrandSurface>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((project) => (
                <BrandSurface
                  key={`${project.title}-${project.client}`}
                  className="group overflow-hidden rounded-xl transition-all hover:border-primary/30 hover:shadow-lg"
                >
                  <div className={`flex h-48 items-center justify-center overflow-hidden ${project.thumbnailUrl ? '' : 'bg-linear-to-br from-primary/10 to-accent/10'}`}>
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <ExternalLink className="h-8 w-8 text-muted-foreground/40 transition-transform group-hover:scale-110" />
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{project.client}</span>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        {project.category}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{project.title}</h3>
                    <p className="tts-brand-body mt-2 text-sm">{project.description}</p>

                    <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                      {project.results}
                    </div>

                    {(project.liveUrl || project.repoUrl || project.figmaUrl) && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                            Live
                          </a>
                        )}
                        {project.repoUrl && (
                          <a href={project.repoUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                            Repo
                          </a>
                        )}
                        {project.figmaUrl && (
                          <a href={project.figmaUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                            Figma
                          </a>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span key={tech} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </BrandSurface>
              ))}
            </div>
          )}
        </BrandContainer>
      </BrandSection>

      <BrandSection className="bg-muted/30 py-16">
        <BrandHeroContainer>
          <h2 className="text-2xl font-bold sm:text-3xl">{content.cta?.title || defaults.cta.title}</h2>
          <p className="tts-brand-body mt-3">{content.cta?.subtitle || defaults.cta.subtitle}</p>
          <Link
            href={content.cta?.buttonHref || defaults.cta.buttonHref}
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {content.cta?.buttonText || defaults.cta.buttonText}
          </Link>
        </BrandHeroContainer>
      </BrandSection>
    </div>
  );
}

function mapProjectToPortfolioItem(project: Project) {
  return {
    title: project.name,
    client: project.client?.name || 'Thong Thai Space Client',
    category: project.showcaseCategory || 'Other',
    description: project.description || 'Featured project from our delivery portfolio.',
    techStack: project.techStack || [],
    results: project.showcaseResults || 'Delivered successfully for our client.',
    thumbnailUrl: resolveAssetUrl(project.thumbnailUrl),
    liveUrl: project.liveUrl,
    repoUrl: project.repoUrl,
    figmaUrl: project.figmaUrl,
  };
}

function resolveAssetUrl(path?: string) {
  if (!path) return undefined;
  return resolveBackendAssetUrl(path) || undefined;
}

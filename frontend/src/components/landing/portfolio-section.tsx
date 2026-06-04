/* eslint-disable @next/next/no-img-element */
'use client';

import { ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSectionContent } from '@/hooks/use-content';
import { useTranslations } from 'next-intl';
import { useShowcaseProjects } from '@/hooks/use-projects';
import type { Project } from '@/types';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import { MotionCard, MotionReveal, MotionSection } from '@/components/motion/motion-primitives';

type PortfolioShape = {
  title?: string;
  subtitle?: string;
};

type PortfolioDisplayItem = {
  title: string;
  client: string;
  category: string;
  description: string;
  techStack: string[];
  results?: string;
  thumbnailUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  figmaUrl?: string;
};

const ALL_CATEGORY = 'All';

// Home is now the only portfolio surface, so this section shows the full
// showcase grid with category filtering (the standalone /portfolio page is gone).
export function PortfolioSection() {
  const { data } = useSectionContent('portfolio');
  const { data: showcaseProjects = [] } = useShowcaseProjects();
  const t = useTranslations('portfolio');
  const tPage = useTranslations('portfolioPage');
  const cms = (data?.data as PortfolioShape) || {};

  const title = cms.title ?? t('title');
  const subtitle = cms.subtitle ?? t('subtitle');
  const fallbackClient = t('fallbackClient');
  const fallbackDescription = t('fallbackDescription');

  const items = useMemo<PortfolioDisplayItem[]>(
    () => showcaseProjects.map((project) => mapProject(project, fallbackClient, fallbackDescription)),
    [showcaseProjects, fallbackClient, fallbackDescription],
  );

  const categories = useMemo(() => {
    if (items.length === 0) return [ALL_CATEGORY];
    const unique = Array.from(new Set(items.map((item) => item.category).filter(Boolean)));
    return [ALL_CATEGORY, ...unique];
  }, [items]);

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const filteredItems = useMemo(
    () => items.filter((item) => activeCategory === ALL_CATEGORY || item.category === activeCategory),
    [activeCategory, items],
  );

  return (
    <MotionSection id="portfolio" className="tts-landing-section relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-8 top-10 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
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

        {items.length === 0 ? (
          <div className="mt-16 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        ) : (
          <>
            {categories.length > 1 && (
              <MotionReveal className="mt-10 flex flex-wrap justify-center gap-2" delay={0.05}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      activeCategory === cat
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {cat === ALL_CATEGORY ? tPage('categoryAll') : cat}
                  </button>
                ))}
              </MotionReveal>
            )}

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((project, index) => (
                <MotionCard
                  key={`${project.title}-${project.client}`}
                  delay={0.06 * index}
                  className="tts-brand-surface group overflow-hidden rounded-2xl transition-all hover:border-primary/35 hover:shadow-[0_22px_55px_-30px_rgba(37,99,235,0.45)]"
                >
                  <div className={`flex h-48 items-center justify-center overflow-hidden ${project.thumbnailUrl ? '' : 'bg-linear-to-br from-primary/10 to-accent/10'}`}>
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <ExternalLink className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{project.client}</div>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{project.category}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{project.title}</h3>
                    <p className="tts-brand-body mt-2 text-sm">{project.description}</p>

                    {project.results && (
                      <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                        {project.results}
                      </div>
                    )}

                    {(project.liveUrl || project.repoUrl || project.figmaUrl) && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                            {t('visit')}
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

                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-slate-200/80 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </MotionCard>
              ))}
            </div>
          </>
        )}
      </div>
    </MotionSection>
  );
}

function mapProject(
  project: Project,
  fallbackClient: string,
  fallbackDescription: string,
): PortfolioDisplayItem {
  return {
    title: project.name,
    client: project.client?.name || fallbackClient,
    category: project.showcaseCategory || 'Other',
    description: project.description || fallbackDescription,
    techStack: project.techStack || [],
    results: project.showcaseResults || undefined,
    thumbnailUrl: resolveBackendAssetUrl(project.thumbnailUrl ?? '') || undefined,
    liveUrl: project.liveUrl,
    repoUrl: project.repoUrl,
    figmaUrl: project.figmaUrl,
  };
}

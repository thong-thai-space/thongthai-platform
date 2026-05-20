/* eslint-disable @next/next/no-img-element */
'use client';

import { ArrowRight, ExternalLink } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useShowcaseProjects } from '@/hooks/use-projects';
import type { Project } from '@/types';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import { MotionCard, MotionReveal, MotionSection } from '@/components/motion/motion-primitives';

type PortfolioShape = {
  title?: string;
  subtitle?: string;
  viewAllText?: string;
};

export function PortfolioSection() {
  const { data } = useSectionContent('portfolio');
  const { data: showcaseProjects = [] } = useShowcaseProjects();
  const t = useTranslations('portfolio');
  const cms = (data?.data as PortfolioShape) || {};

  const title = cms.title ?? t('title');
  const subtitle = cms.subtitle ?? t('subtitle');
  const viewAllText = cms.viewAllText ?? t('viewAll');
  const fallbackClient = t('fallbackClient');
  const fallbackDescription = t('fallbackDescription');
  const items = showcaseProjects
    .slice(0, 3)
    .map((project) => mapProjectToFeaturedCard(project, fallbackClient, fallbackDescription));

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
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((project, index) => (
              <MotionCard
                key={`${project.title}-${project.client}`}
                delay={0.08 * index}
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
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-slate-500 hover:text-primary dark:text-slate-300"
                      >
                        {t('visit')}
                      </a>
                    )}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{project.title}</h3>
                  <p className="tts-brand-body mt-2 text-sm">{project.description}</p>
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
        )}

        <MotionReveal className="mt-12 text-center" delay={0.12}>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5"
          >
            {viewAllText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </MotionReveal>
      </div>
    </MotionSection>
  );
}

function mapProjectToFeaturedCard(
  project: Project,
  fallbackClient: string,
  fallbackDescription: string,
) {
  return {
    title: project.name,
    client: project.client?.name || fallbackClient,
    description: project.description || fallbackDescription,
    techStack: project.techStack || [],
    thumbnailUrl: resolveAssetUrl(project.thumbnailUrl),
    liveUrl: project.liveUrl,
  };
}

function resolveAssetUrl(path?: string) {
  if (!path) return undefined;
  return resolveBackendAssetUrl(path) || undefined;
}

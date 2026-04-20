/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { useShowcaseProjects } from '@/hooks/use-projects';
import type { Project } from '@/types';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import { MotionCard, MotionReveal, MotionSection } from '@/components/motion/motion-primitives';

const defaults = {
  title: 'Featured Projects',
  subtitle: 'A selection of projects we have successfully delivered for our clients',
  viewAllText: 'View all projects',
  items: [
    {
      title: 'E-Commerce Platform',
      client: 'Fashion Brand',
      description: 'Full-featured e-commerce platform with inventory management and integrated payment system.',
      techStack: ['Next.js', 'Node.js', 'PostgreSQL', 'Stripe'],
    },
    {
      title: 'Healthcare App',
      client: 'MedTech Startup',
      description: 'Appointment booking and online health consultation app for medical clinics.',
      techStack: ['React Native', 'NestJS', 'AI Chatbot'],
    },
    {
      title: 'AI Analytics Dashboard',
      client: 'Logistics Corp',
      description: 'Shipping data analytics dashboard with AI-powered trend prediction and route optimization.',
      techStack: ['React', 'Python', 'TensorFlow', 'D3.js'],
    },
  ],
};

export function PortfolioSection() {
  const { data } = useSectionContent('portfolio');
  const { data: showcaseProjects = [] } = useShowcaseProjects();
  const c = (data?.data as typeof defaults) || defaults;

  const items = showcaseProjects.slice(0, 3).map((project) => mapProjectToFeaturedCard(project));

  return (
    <MotionSection id="portfolio" className="tts-landing-section relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-8 top-10 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
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

        {items.length === 0 ? (
          <div className="mt-16 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No featured projects yet. Go to Dashboard → Content → Portfolio and enable projects as Featured.
            </p>
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
                        Visit
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
            {c.viewAllText || 'View all projects'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </MotionReveal>
      </div>
    </MotionSection>
  );
}

function mapProjectToFeaturedCard(project: Project) {
  return {
    title: project.name,
    client: project.client?.name || 'Thong Thai Space Client',
    description: project.description || 'Featured project from our delivery portfolio.',
    techStack: project.techStack || [],
    thumbnailUrl: resolveAssetUrl(project.thumbnailUrl),
    liveUrl: project.liveUrl,
  };
}

function resolveAssetUrl(path?: string) {
  if (!path) return undefined;
  return resolveBackendAssetUrl(path) || undefined;
}

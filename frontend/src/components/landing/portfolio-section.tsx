/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { useShowcaseProjects } from '@/hooks/use-projects';
import type { Project } from '@/types';
import { getApiOrigin } from '@/lib/asset-url';

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
    <section id="portfolio" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {c.subtitle}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-16 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No featured projects yet. Go to Dashboard → Content → Portfolio and enable projects as Featured.
            </p>
          </div>
        ) : (
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((project) => (
              <div
                key={`${project.title}-${project.client}`}
                className="group overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-primary/30 hover:shadow-lg"
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
                    <div className="text-xs font-medium text-primary">{project.client}</div>
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-muted-foreground hover:text-primary"
                      >
                        Visit
                      </a>
                    )}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">{project.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {c.viewAllText || 'View all projects'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
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
  if (path.startsWith('http')) return path;
  const apiBase = getApiOrigin();
  return `${apiBase}${path}`;
}

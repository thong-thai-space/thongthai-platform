/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { useShowcaseProjects } from '@/hooks/use-projects';
import type { Project } from '@/types';
import { useMemo, useState } from 'react';
import { getApiOrigin } from '@/lib/asset-url';

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

const defaults: PortfolioContent = {
  hero: {
    title: 'Featured Projects',
    titleHighlight: 'Projects',
    subtitle: 'Products we are proud to have built with our clients from concept to reality',
  },
  categories: ['All', 'Web', 'Mobile', 'AI', 'Web + Mobile'],
  items: [
    {
      title: 'E-Commerce Platform',
      client: 'Fashion Brand',
      category: 'Web',
      description: 'E-commerce platform with inventory management, online payments, and analytics dashboard.',
      techStack: ['Next.js', 'Node.js', 'PostgreSQL', 'Stripe', 'Redis'],
      results: 'Increased online revenue by 300% in the first 3 months.',
    },
    {
      title: 'Healthcare Booking App',
      client: 'MedTech Startup',
      category: 'Mobile',
      description: 'Appointment booking and online health consultation app for a clinic chain.',
      techStack: ['React Native', 'NestJS', 'PostgreSQL', 'Socket.IO'],
      results: '10,000+ downloads in the first month, 4.8-star rating.',
    },
    {
      title: 'AI Analytics Dashboard',
      client: 'Logistics Corp',
      category: 'AI',
      description: 'Shipping data analytics dashboard with AI-powered trend prediction and route optimization.',
      techStack: ['React', 'Python', 'TensorFlow', 'D3.js', 'PostgreSQL'],
      results: 'Reduced shipping costs by 40%, saving $80,000/year.',
    },
    {
      title: 'Restaurant Management System',
      client: 'Food Chain',
      category: 'Web',
      description: 'Restaurant management system: orders, inventory, staffing, and revenue reports.',
      techStack: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis', 'Docker'],
      results: 'Deployed across 15 branches, reducing order processing time by 50%.',
    },
    {
      title: 'Real Estate Platform',
      client: 'Property Group',
      category: 'Web',
      description: 'Real estate listing platform with interactive maps, smart search, and chat.',
      techStack: ['Next.js', 'Node.js', 'MongoDB', 'Mapbox', 'Socket.IO'],
      results: '5,000+ listings, 50,000 monthly visits.',
    },
    {
      title: 'Education LMS',
      client: 'EdTech Startup',
      category: 'Web + Mobile',
      description: 'Online learning management system with video streaming, quizzes, and AI tutor features.',
      techStack: ['React', 'React Native', 'NestJS', 'OpenAI', 'AWS S3'],
      results: '2,000+ students, course completion rate increased by 60%.',
    },
  ],
  cta: {
    title: 'Want a similar product?',
    subtitle: 'Tell us your idea and get a free quote.',
    buttonText: 'Get a quote',
    buttonHref: '/contact',
  },
};

export function PortfolioPageContent() {
  const { data } = useSectionContent('portfolio');
  const { data: showcaseProjects = [] } = useShowcaseProjects();
  const content = (data?.data as PortfolioContent) || defaults;

  const dbItems = useMemo<PortfolioDisplayItem[]>(() => showcaseProjects.map(mapProjectToPortfolioItem), [showcaseProjects]);
  const items: PortfolioDisplayItem[] = dbItems;
  const categories = useMemo(() => {
    if (dbItems.length === 0) return ['All'];

    const unique = Array.from(new Set(dbItems.map((item) => item.category).filter(Boolean)));
    return ['All', ...unique];
  }, [dbItems]);
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredItems = useMemo(
    () => items.filter((item) => activeCategory === 'All' || item.category === activeCategory),
    [activeCategory, items],
  );

  return (
    <div>
      <section className="bg-linear-to-br from-background via-background to-primary/5 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {content.hero.titleHighlight ? (
              <>
                {content.hero.title.replace(content.hero.titleHighlight, '').trim()}{' '}
                <span className="text-primary">{content.hero.titleHighlight}</span>
              </>
            ) : (
              content.hero.title
            )}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{content.hero.subtitle}</p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto py-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'border-b-2 border-primary pb-3 text-primary'
                    : 'pb-3 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No featured projects configured yet. Please enable showcase projects in Dashboard → Content → Portfolio.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((project) => (
                <div
                  key={`${project.title}-${project.client}`}
                  className="group overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-primary/30 hover:shadow-lg"
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
                    <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>

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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{content.cta?.title || defaults.cta.title}</h2>
          <p className="mt-3 text-muted-foreground">{content.cta?.subtitle || defaults.cta.subtitle}</p>
          <Link
            href={content.cta?.buttonHref || defaults.cta.buttonHref}
            className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {content.cta?.buttonText || defaults.cta.buttonText}
          </Link>
        </div>
      </section>
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
  if (path.startsWith('http')) return path;
  const apiBase = getApiOrigin();
  return `${apiBase}${path}`;
}

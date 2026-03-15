'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  Check,
  Globe,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import type { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Globe,
  Smartphone,
  Brain,
  MessageSquare,
};

const serviceDefaults = [
  {
    id: 'web',
    icon: 'Globe',
    title: 'Web Development',
    description:
      'Build modern websites and web applications using cutting-edge technologies. From simple landing pages to complex systems.',
    features: [
      'Business corporate websites',
      'Web applications (SaaS, CRM, ERP)',
      'E-commerce & marketplace',
      'Admin dashboard & CMS',
      'Progressive Web App (PWA)',
      'API development & integration',
    ],
    techStack: ['Next.js', 'React', 'Node.js', 'NestJS', 'PostgreSQL', 'Redis'],
  },
  {
    id: 'app',
    icon: 'Smartphone',
    title: 'Mobile Apps',
    description:
      'Develop high-quality iOS & Android applications with professional UI/UX design.',
    features: [
      'iOS & Android native apps',
      'Cross-platform (React Native, Flutter)',
      'Mobile-first UI/UX design',
      'Push notification & realtime',
      'Offline-first architecture',
      'App Store & Play Store publish',
    ],
    techStack: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
  },
  {
    id: 'ai',
    icon: 'Brain',
    title: 'AI Solutions',
    description:
      'Integrate artificial intelligence into products and business processes to automate and optimize performance.',
    features: [
      'AI Chatbot & Virtual Assistant',
      'Intelligent data analytics',
      'Robotic Process Automation (RPA)',
      'Computer Vision & OCR',
      'NLP & Text Analytics',
      'Recommendation System',
    ],
    techStack: ['OpenAI', 'Anthropic Claude', 'LangChain', 'Python', 'TensorFlow'],
  },
  {
    id: 'consulting',
    icon: 'MessageSquare',
    title: 'IT Consulting',
    description:
      'Strategic technology consulting, system architecture, and tailored digital transformation roadmaps.',
    features: [
      'Digital transformation strategy',
      'System architecture & cloud',
      'Current technology assessment',
      'Digital transformation roadmap',
      'Technical team training',
      'Code review & technical audit',
    ],
    techStack: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Monitoring'],
  },
];

type ServicesPageContentType = {
  hero: {
    title: string;
    titleHighlight?: string;
    subtitle: string;
  };
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonHref: string;
  };
};

const contentDefaults: ServicesPageContentType = {
  hero: {
    title: 'Technology Services',
    titleHighlight: 'Services',
    subtitle:
      'End-to-end solutions from design, development to deployment and operations. We partner with you through every stage.',
  },
  cta: {
    title: 'Which solution do you need?',
    subtitle: 'Contact us now for a free consultation and detailed quote.',
    buttonText: 'Contact us',
    buttonHref: '/contact',
  },
};

export function ServicesPageContent() {
  const { data: servicesData } = useSectionContent('services');
  const { data: pageData } = useSectionContent('servicesPage');

  const services = (servicesData?.data as { items?: typeof serviceDefaults } | undefined)?.items || serviceDefaults;
  const c = (pageData?.data as ServicesPageContentType) || contentDefaults;

  const titleParts =
    c.hero.titleHighlight && c.hero.title.includes(c.hero.titleHighlight)
      ? c.hero.title.split(c.hero.titleHighlight)
      : null;

  return (
    <div>
      <section className="bg-linear-to-br from-background via-background to-primary/5 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
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
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{c.hero.subtitle}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {services.map((service, idx) => {
              const Icon = iconMap[service.icon] || Globe;
              return (
                <div
                  key={service.id || service.title}
                  id={service.id || service.title.toLowerCase().replace(/\s+/g, '-')}
                  className={`flex flex-col gap-12 lg:flex-row lg:items-center ${
                    idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h2 className="text-2xl font-bold">{service.title}</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground">{service.description}</p>
                    <ul className="mt-6 space-y-2">
                      {service.features?.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
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
                  </div>

                  <div className="flex flex-1 items-center justify-center rounded-2xl bg-linear-to-br from-primary/5 to-accent/5 p-12">
                    <Icon className="h-24 w-24 text-primary/20" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">{c.cta.title}</h2>
          <p className="mt-3 text-primary-foreground/80">{c.cta.subtitle}</p>
          <Link
            href={c.cta.buttonHref}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-primary transition-all hover:bg-white/90"
          >
            {c.cta.buttonText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

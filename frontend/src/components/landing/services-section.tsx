'use client';

import { Globe, Smartphone, Brain, MessageSquare } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { MotionCard, MotionReveal, MotionSection } from '@/components/motion/motion-primitives';

const iconMap: Record<string, any> = { Globe, Smartphone, Brain, MessageSquare };

const defaults = {
  title: 'Our Services',
  subtitle: 'Comprehensive technology solutions, from idea to finished product',
  items: [
    {
      icon: 'Globe',
      title: 'Web Development',
      description:
        'Websites, web apps, and e-commerce with modern technology: Next.js, React, Node.js. SEO and performance optimized.',
      features: ['Landing page', 'Web application', 'E-commerce', 'Admin dashboard'],
    },
    {
      icon: 'Smartphone',
      title: 'Mobile Apps',
      description:
        'iOS & Android apps with React Native and Flutter. Beautiful UI/UX design with smooth user experience.',
      features: ['iOS & Android', 'Cross-platform', 'UI/UX Design', 'App Store publish'],
    },
    {
      icon: 'Brain',
      title: 'AI Solutions',
      description:
        'Integrate AI into business processes: chatbots, data analysis, workflow automation.',
      features: ['AI Chatbot', 'Data Analytics', 'Process Automation', 'NLP Solutions'],
    },
    {
      icon: 'MessageSquare',
      title: 'IT Consulting',
      description:
        'Digital transformation strategy, system architecture, and technology selection for your business.',
      features: ['Digital Strategy', 'System Architecture', 'Tech Audit', 'Team Training'],
    },
  ],
};

export function ServicesSection() {
  const { data } = useSectionContent('services');
  const c = (data?.data as typeof defaults) || defaults;

  return (
    <MotionSection id="services" className="tts-landing-section relative overflow-hidden bg-linear-to-b from-white to-slate-50 py-20 sm:py-28 dark:from-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
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

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {c.items.map((service) => {
            const Icon = iconMap[service.icon];
            return (
              <MotionCard
                key={service.title}
                delay={0.06 * c.items.indexOf(service)}
                className="group rounded-2xl border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-primary/35 hover:shadow-[0_20px_45px_-28px_rgba(37,99,235,0.45)] dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {Icon && <Icon className="h-6 w-6" />}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{service.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
                <ul className="mt-4 space-y-1">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </MotionCard>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
}

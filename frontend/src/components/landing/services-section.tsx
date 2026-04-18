'use client';

import { Globe, Smartphone, Brain, MessageSquare } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { MotionCard, MotionReveal } from '@/components/motion/motion-primitives';

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
    <section id="services" className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
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
                className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {Icon && <Icon className="h-6 w-6" />}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                <ul className="mt-4 space-y-1">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
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
    </section>
  );
}

'use client';

import { MessageSquare, Lightbulb, Code, Rocket } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';

const iconMap: Record<string, any> = { MessageSquare, Lightbulb, Code, Rocket };

const defaults = {
  title: 'Our Process',
  subtitle: '4 simple steps from idea to finished product',
  steps: [
    {
      icon: 'MessageSquare',
      step: '01',
      title: 'Discuss & Analyze',
      description:
        'Listen to requirements, analyze business needs, and recommend the best technology solution.',
    },
    {
      icon: 'Lightbulb',
      step: '02',
      title: 'Design & Plan',
      description:
        'UI/UX design, system architecture, detailed cost estimation and timeline.',
    },
    {
      icon: 'Code',
      step: '03',
      title: 'Develop & Test',
      description:
        'Agile development process, thorough testing, and continuous progress updates.',
    },
    {
      icon: 'Rocket',
      step: '04',
      title: 'Deploy & Support',
      description:
        'Product launch, usage training, long-term maintenance and technical support.',
    },
  ],
};

export function ProcessSection() {
  const { data } = useSectionContent('process');
  const c = (data?.data as typeof defaults) || defaults;

  return (
    <section className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {c.subtitle}
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {c.steps.map((item, idx) => {
            const Icon = iconMap[item.icon];
            return (
              <div key={item.step} className="relative text-center">
                {/* Connector line */}
                {idx < c.steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-border lg:block" />
                )}

                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-primary">
                  {Icon && <Icon className="h-7 w-7" />}
                </div>
                <div className="mt-2 text-xs font-bold text-primary">{item.step}</div>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

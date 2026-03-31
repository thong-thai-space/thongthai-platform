/* eslint-disable @next/next/no-img-element */
'use client';

import { Award, Heart, Target, Users } from 'lucide-react';
import { useSectionContent } from '@/hooks/use-content';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import type { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Target,
  Users,
  Heart,
  Award,
};

type AboutContent = {
  hero: {
    title: string;
    subtitle: string;
  };
  valuesTitle: string;
  values: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  teamTitle: string;
  teamSubtitle: string;
  team: Array<{
    name: string;
    role: string;
    bio: string;
    avatar?: string;
  }>;
};

const defaults: AboutContent = {
  hero: {
    title: 'About Thong Thai Space',
    subtitle:
      'We are a team of technology experts specializing in Web, App, AI development and IT consulting for small and medium businesses. Our mission is to help businesses achieve effective digital transformation with affordable costs and international quality standards.',
  },
  valuesTitle: 'Core Values',
  values: [
    {
      icon: 'Target',
      title: 'Quality',
      description: 'Committed to high-quality products, clean code, great performance, and security.',
    },
    {
      icon: 'Users',
      title: 'Partnership',
      description: "Not just a vendor, but a long-term partner committed to our clients' success.",
    },
    {
      icon: 'Heart',
      title: 'Dedication',
      description: "We listen, understand, and put our clients' interests first in every project.",
    },
    {
      icon: 'Award',
      title: 'Innovation',
      description: 'Constantly adopting new technologies and applying creative solutions to every challenge.',
    },
  ],
  teamTitle: 'Our Team',
  teamSubtitle: 'The people behind every successful project',
  team: [
    {
      name: 'Nguyen Hoang Thai',
      role: 'Founder & CEO',
      bio: 'Full-stack developer with <1 years of experience, passionate about AI and automation.',
      avatar: '',
    },
    {
      name: 'Nguyen Hoang Thai',
      role: 'Development Team',
      bio: 'Experienced software engineers specializing in Web, Mobile, and AI.',
      avatar: '',
    },
    {
      name: 'Nguyen Hoang Tuan',
      role: 'Draphic Designer',
      bio: 'Creating beautiful interfaces and optimal user experiences.',
      avatar: '',
    },
  ],
};

export function AboutPageContent() {
  const { data } = useSectionContent('about');
  const c = (data?.data as AboutContent) || defaults;

  return (
    <div>
      <section className="bg-linear-to-br from-background via-background to-primary/5 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {c.hero.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{c.hero.subtitle}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">{c.valuesTitle}</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {c.values.map((v) => {
              const Icon = iconMap[v.icon] || Target;
              return (
                <div key={v.title} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">{c.teamTitle}</h2>
          <p className="mt-4 text-center text-muted-foreground">{c.teamSubtitle}</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {c.team.map((member, index) => (
              <div
                key={`${member.name}-${index}`}
                className="rounded-xl border border-border bg-background p-6 text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {member.avatar ? (
                    <img
                      src={resolveAssetUrl(member.avatar)}
                      alt={member.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
                <div className="text-sm text-primary">{member.role}</div>
                <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function resolveAssetUrl(path?: string) {
  if (!path) return '';
  return resolveBackendAssetUrl(path) || '';
}

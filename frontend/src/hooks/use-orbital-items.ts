import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useShowcaseProjects } from './use-projects';
import { useSectionContent } from './use-content';
import type { Project } from '@/types';

export type OrbitalKind = 'service' | 'project';

export type OrbitalItem = {
  id: string;
  kind: OrbitalKind;
  name: string;
  short: string;
  details: string;
  href: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
};

// Fallback services with default orbital mechanics
const FALLBACK_SERVICES: OrbitalItem[] = [
  {
    id: 'svc-web-app',
    kind: 'service',
    name: 'Web & App Development',
    short: 'Build robust web and mobile experiences.',
    details:
      'From discovery to delivery, we engineer scalable products with modern architecture, clean UI, and fast performance for growth-stage businesses.',
    href: '/services',
    color: '#3B82F6',
    orbitRadius: 7.2,
    orbitSpeed: 0.34,
    size: 0.58,
  },
  {
    id: 'svc-ai',
    kind: 'service',
    name: 'AI Integration',
    short: 'Apply AI where it moves metrics.',
    details:
      'We design AI workflows for chat, estimation, automation, and recommendations with measurable outcomes, safety controls, and reliable operations.',
    href: '/services',
    color: '#38BDF8',
    orbitRadius: 7.2,
    orbitSpeed: 0.38,
    size: 0.55,
  },
  {
    id: 'svc-consulting',
    kind: 'service',
    name: 'IT Consulting',
    short: 'Turn technical complexity into clear action.',
    details:
      'We audit architecture, security, and delivery workflows to create practical roadmaps that reduce risk, improve speed, and scale your product team.',
    href: '/services',
    color: '#EAB308',
    orbitRadius: 7.2,
    orbitSpeed: 0.3,
    size: 0.5,
  },
];

// Orbital mechanics schema: service color, position, speed
type ServiceData = {
  name: string;
  short: string;
  details: string;
  color?: string;
  orbitRadius?: number;
  orbitSpeed?: number;
  size?: number;
};

type HeroContent = {
  services?: ServiceData[];
};

/**
 * Transform Project to OrbitalItem (project kind)
 * Pattern: Data Transformer for API → UI domain mapping
 */
function projectToOrbitalItem(project: Project, index: number): OrbitalItem {
  const serviceColors = ['#F97316', '#A78BFA', '#22C55E', '#FC6584', '#FBBF24', '#10B981'];
  return {
    id: `prj-${project.id}`,
    kind: 'project',
    name: project.name || `Project ${index + 1}`,
    short: project.description?.slice(0, 50) || 'Featured project',
    details: project.description || 'A featured project showcase',
    href: '/portfolio',
    color: serviceColors[index % serviceColors.length],
    orbitRadius: 10.8,
    orbitSpeed: 0.2 + (index * 0.02),
    size: 0.66 - (index * 0.03),
  };
}

/**
 * Transform CMS hero content services to OrbitalItem (service kind)
 * Falls back to hardcoded services if API response is empty
 * Pattern: Defensive programming with fallback data
 */
function contentToOrbitalServices(heroContent: HeroContent | undefined): OrbitalItem[] {
  if (!heroContent?.services || heroContent.services.length === 0) {
    return FALLBACK_SERVICES;
  }

  return heroContent.services.map((svc, idx) => ({
    id: `svc-${idx}`,
    kind: 'service' as OrbitalKind,
    name: svc.name,
    short: svc.short,
    details: svc.details,
    href: '/services',
    color: svc.color || FALLBACK_SERVICES[idx % FALLBACK_SERVICES.length].color,
    orbitRadius: svc.orbitRadius ?? FALLBACK_SERVICES[idx % FALLBACK_SERVICES.length].orbitRadius,
    orbitSpeed: svc.orbitSpeed ?? FALLBACK_SERVICES[idx % FALLBACK_SERVICES.length].orbitSpeed,
    size: svc.size ?? FALLBACK_SERVICES[idx % FALLBACK_SERVICES.length].size,
  }));
}

/**
 * Hook: Fetch and merge orbital items from Portfolio API + CMS
 * Returns combined services (from CMS) + featured projects (from Portfolio)
 * 
 * Loading precedence:
 * 1. While both queries pending → isLoading true, data array empty
 * 2. Once any data arrives → returns combined items
 * 3. On error → falls back to hardcoded services + empty projects
 */
export function useOrbitalItems(): UseQueryResult<OrbitalItem[], Error> {
  const projectsQuery = useShowcaseProjects();
  const contentQuery = useSectionContent('hero');

  return useQuery<OrbitalItem[], Error>({
    queryKey: ['orbital-items'],
    queryFn: () => {
      // Both queries must have initial data to proceed
      if (!projectsQuery.data || !contentQuery.data) {
        return Promise.reject(new Error('Data not yet loaded'));
      }

      // transformations
      const services = contentToOrbitalServices(contentQuery.data.data as HeroContent);
      const projects = projectsQuery.data.slice(0, 3).map(projectToOrbitalItem);

      return Promise.resolve([...services, ...projects]);
    },
    enabled: !!projectsQuery.data && !!contentQuery.data,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Convenience hook: Returns combined services + projects with fallback
 * Useful for rendering when you don't want to handle loading states
 * 
 * Returns:
 * - Services from CMS (or fallback hardcoded)
 * - First 3 featured projects from Portfolio
 */
export function useOrbitalItemsWithFallback(): OrbitalItem[] {
  const projectsQuery = useShowcaseProjects();
  const contentQuery = useSectionContent('hero');

  const services = contentToOrbitalServices(contentQuery.data?.data as HeroContent);
  const projects = (projectsQuery.data || [])
    .slice(0, 3)
    .map((project, idx) => projectToOrbitalItem(project, idx));

  return [...services, ...projects];
}

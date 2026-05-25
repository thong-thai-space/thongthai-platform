import { NotFoundException } from '@nestjs/common';
import type {
  PortfolioRepositoryPort,
  ShowcaseProjectSummary,
  UpdateShowcaseInput,
} from '../domain/portfolio.repository.port';
import { PortfolioUseCases } from './portfolio.use-cases';

// Pattern: Unit-test against port — fake repository, real use-case logic.

function buildSummary(
  overrides: Partial<ShowcaseProjectSummary> = {},
): ShowcaseProjectSummary {
  return {
    id: 'proj_1',
    name: 'E-Commerce Platform',
    description: 'A great shop',
    client: { id: 'c_1', name: 'Fashion Brand' },
    techStack: ['Next.js', 'NestJS'],
    repoUrl: null,
    liveUrl: 'https://example.com',
    figmaUrl: null,
    showcaseCategory: 'Web',
    showcaseResults: '+300% revenue',
    thumbnailUrl: null,
    screenshots: [],
    showcaseOrder: 1,
    ...overrides,
  };
}

function buildSubject(projects: ShowcaseProjectSummary[] = []) {
  const updates: { id: string; data: UpdateShowcaseInput }[] = [];
  const repo: PortfolioRepositoryPort = {
    findShowcaseProjects: jest.fn(async () => projects),
    updateShowcaseProject: jest.fn(async (id, data) => {
      const existing = projects.find((p) => p.id === id);
      if (!existing) throw new NotFoundException('Project not found');
      updates.push({ id, data });
      return { ...existing, ...data } as ShowcaseProjectSummary;
    }),
  };
  return { repo, updates, useCase: new PortfolioUseCases(repo as never) };
}

describe('PortfolioUseCases', () => {
  describe('getShowcase', () => {
    it('returns an empty list when no projects exist', async () => {
      const { useCase } = buildSubject([]);
      await expect(useCase.getShowcase()).resolves.toEqual([]);
    });

    it('returns all showcase projects from the repository', async () => {
      const projects = [buildSummary(), buildSummary({ id: 'proj_2', name: 'App' })];
      const { useCase } = buildSubject(projects);
      const result = await useCase.getShowcase();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('proj_1');
    });
  });

  describe('updateShowcase', () => {
    it('delegates the update to the repository', async () => {
      const { useCase, updates } = buildSubject([buildSummary()]);
      await useCase.updateShowcase('proj_1', { showcaseOrder: 2 });
      expect(updates).toHaveLength(1);
      expect(updates[0]).toMatchObject({ id: 'proj_1', data: { showcaseOrder: 2 } });
    });

    it('applies partial updates and returns the merged result', async () => {
      const { useCase } = buildSubject([buildSummary({ thumbnailUrl: null })]);
      const result = await useCase.updateShowcase('proj_1', {
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        showcaseCategory: 'Mobile',
      });
      expect(result.thumbnailUrl).toBe('https://cdn.example.com/thumb.jpg');
      expect(result.showcaseCategory).toBe('Mobile');
    });

    it('propagates NotFoundException when project does not exist', async () => {
      const { useCase } = buildSubject([]);
      await expect(
        useCase.updateShowcase('proj_missing', { isShowcase: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

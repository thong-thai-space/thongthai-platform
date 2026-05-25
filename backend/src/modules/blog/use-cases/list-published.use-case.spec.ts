import { Language } from '@prisma/client';
import type { BlogRepositoryPort } from '../domain/blog.repository.port';
import { ListPublishedBlogPostsUseCase } from './list-published.use-case';

// Pattern: Unit-test against port — fake repository, real pagination logic.

function buildRepo(items: unknown[] = []) {
  const calls: unknown[] = [];
  const repo: BlogRepositoryPort = {
    listPublished: jest.fn(async (filter) => {
      calls.push(filter);
      return { items: items as never, total: items.length, page: filter.page, pageSize: filter.pageSize };
    }),
    listAll: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listPublishedSlugs: jest.fn(),
  };
  return { repo, calls };
}

describe('ListPublishedBlogPostsUseCase', () => {
  it('passes locale and tag through to the repository', async () => {
    const { repo, calls } = buildRepo();
    const useCase = new ListPublishedBlogPostsUseCase(repo as never);
    await useCase.execute({ locale: Language.VI, tag: 'nestjs' });
    expect(calls[0]).toMatchObject({ locale: Language.VI, tag: 'nestjs' });
  });

  it('defaults to page 1 and pageSize 10', async () => {
    const { repo, calls } = buildRepo();
    const useCase = new ListPublishedBlogPostsUseCase(repo as never);
    await useCase.execute({ locale: Language.EN });
    expect(calls[0]).toMatchObject({ page: 1, pageSize: 10 });
  });

  it('clamps page to minimum 1', async () => {
    const { repo, calls } = buildRepo();
    const useCase = new ListPublishedBlogPostsUseCase(repo as never);
    await useCase.execute({ locale: Language.VI, page: -5 });
    expect((calls[0] as { page: number }).page).toBe(1);
  });

  it('clamps pageSize to maximum 50', async () => {
    const { repo, calls } = buildRepo();
    const useCase = new ListPublishedBlogPostsUseCase(repo as never);
    await useCase.execute({ locale: Language.VI, pageSize: 999 });
    expect((calls[0] as { pageSize: number }).pageSize).toBe(50);
  });

  it('clamps pageSize to minimum 1', async () => {
    const { repo, calls } = buildRepo();
    const useCase = new ListPublishedBlogPostsUseCase(repo as never);
    await useCase.execute({ locale: Language.VI, pageSize: 0 });
    expect((calls[0] as { pageSize: number }).pageSize).toBe(1);
  });

  it('forwards the repository result to the caller', async () => {
    const stub = { id: 'p_1', slug: 'hello', locale: Language.VI } as never;
    const { repo } = buildRepo([stub]);
    const useCase = new ListPublishedBlogPostsUseCase(repo as never);
    const result = await useCase.execute({ locale: Language.VI });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toBe(stub);
  });
});

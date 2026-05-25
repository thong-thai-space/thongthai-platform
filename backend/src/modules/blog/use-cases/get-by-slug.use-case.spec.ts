import { NotFoundException } from '@nestjs/common';
import { BlogPostStatus, Language } from '@prisma/client';
import type { BlogRepositoryPort } from '../domain/blog.repository.port';
import { GetBlogPostBySlugUseCase } from './get-by-slug.use-case';

// Pattern: Unit-test against port — fake repository, real visibility rules.

function buildPost(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p_1',
    slug: 'hello',
    locale: Language.VI,
    title: 'Hello',
    excerpt: null,
    contentMdx: 'body',
    coverImageUrl: null,
    tags: [],
    status: BlogPostStatus.PUBLISHED,
    publishedAt: new Date('2025-01-01T00:00:00Z'),
    authorId: 'u_1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as never;
}

function buildUseCase(post: ReturnType<typeof buildPost> | null) {
  const repo: BlogRepositoryPort = {
    listPublished: jest.fn(),
    listAll: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(async () => post),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listPublishedSlugs: jest.fn(),
  };
  return new GetBlogPostBySlugUseCase(repo as never);
}

describe('GetBlogPostBySlugUseCase', () => {
  it('throws NotFoundException when the slug does not exist', async () => {
    const useCase = buildUseCase(null);
    await expect(
      useCase.execute(Language.VI, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException for a DRAFT post', async () => {
    const useCase = buildUseCase(buildPost({ status: BlogPostStatus.DRAFT }));
    await expect(
      useCase.execute(Language.VI, 'hello'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when publishedAt is null', async () => {
    const useCase = buildUseCase(
      buildPost({ status: BlogPostStatus.PUBLISHED, publishedAt: null }),
    );
    await expect(
      useCase.execute(Language.VI, 'hello'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when publishedAt is in the future', async () => {
    const future = new Date(Date.now() + 86_400_000); // +1 day
    const useCase = buildUseCase(
      buildPost({ status: BlogPostStatus.PUBLISHED, publishedAt: future }),
    );
    await expect(
      useCase.execute(Language.VI, 'hello'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the post when it is published and publishedAt is in the past', async () => {
    const post = buildPost();
    const useCase = buildUseCase(post);
    const result = await useCase.execute(Language.VI, 'hello');
    expect(result).toBe(post);
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlogPost, BlogPostStatus, Language } from '@prisma/client';
import type { BlogRepositoryPort } from '../domain/blog.repository.port';
import { BlogPublishPolicy } from '../policies/blog-publish.policy';
import { BlogAdminUseCases } from './admin.use-cases';

// Pattern: Unit-test against ports — fake repository, real policy.

function buildPost(overrides: Record<string, unknown> = {}): BlogPost {
  return {
    id: 'p_1',
    slug: 'hello',
    locale: Language.VI,
    title: 'Hello',
    excerpt: null,
    contentMdx: 'body',
    coverImageUrl: null,
    tags: [],
    status: BlogPostStatus.DRAFT,
    publishedAt: null,
    authorId: 'u_1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as BlogPost;
}

function buildSubject(existing: ReturnType<typeof buildPost> | null) {
  const updates: { id: string; data: unknown }[] = [];
  const repo: BlogRepositoryPort = {
    listPublished: jest.fn(),
    listAll: jest.fn(),
    findById: jest.fn(async () => existing),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(async (id, data) => {
      updates.push({ id, data });
      return { ...(existing ?? buildPost()), ...(data as object) } as never;
    }),
    delete: jest.fn(),
    listPublishedSlugs: jest.fn(),
  };
  return {
    repo,
    updates,
    useCase: new BlogAdminUseCases(repo, new BlogPublishPolicy()),
  };
}

describe('BlogAdminUseCases', () => {
  describe('publish', () => {
    it('rejects when the draft has no content', async () => {
      const { useCase } = buildSubject(buildPost({ contentMdx: '   ' }));
      await expect(useCase.publish('p_1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('stamps publishedAt and flips status on first publish', async () => {
      const { useCase, updates } = buildSubject(buildPost());
      const before = Date.now();
      await useCase.publish('p_1');
      expect(updates).toHaveLength(1);
      const data = updates[0].data as { status: string; publishedAt: Date };
      expect(data.status).toBe(BlogPostStatus.PUBLISHED);
      expect(data.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('preserves publishedAt on re-publish', async () => {
      const original = new Date('2025-06-01T00:00:00Z');
      const { useCase, updates } = buildSubject(
        buildPost({
          status: BlogPostStatus.PUBLISHED,
          publishedAt: original,
        }),
      );
      await useCase.publish('p_1');
      const data = updates[0].data as { publishedAt: Date };
      expect(data.publishedAt).toBe(original);
    });
  });

  describe('update', () => {
    it('throws NotFound when missing', async () => {
      const { useCase } = buildSubject(null);
      await expect(
        useCase.update('p_missing', { title: 'New' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('validates slug when slug changes', async () => {
      const { useCase } = buildSubject(buildPost());
      await expect(
        useCase.update('p_1', { slug: 'Has Space' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('passes through valid updates', async () => {
      const { useCase, updates } = buildSubject(buildPost());
      await useCase.update('p_1', { title: 'New title', slug: 'new-title' });
      expect(updates[0].data).toMatchObject({
        title: 'New title',
        slug: 'new-title',
      });
    });
  });

  describe('create', () => {
    it('validates the slug', async () => {
      const { useCase } = buildSubject(null);
      await expect(
        useCase.create(
          {
            title: 'Hello',
            slug: 'BAD SLUG',
            locale: Language.VI,
            contentMdx: 'body',
          },
          'u_1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

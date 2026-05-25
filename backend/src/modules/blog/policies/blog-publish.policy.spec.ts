import { BadRequestException } from '@nestjs/common';
import { BlogPostStatus } from '@prisma/client';
import { BlogPublishPolicy } from './blog-publish.policy';

describe('BlogPublishPolicy', () => {
  const policy = new BlogPublishPolicy();

  describe('assertSlug', () => {
    it.each(['hello', 'hello-world', 'a1', '2026-q1-report'])(
      'accepts "%s"',
      (slug) => {
        expect(() => policy.assertSlug(slug)).not.toThrow();
      },
    );

    it.each(['', 'Hello', 'has space', 'has_underscore', '-leading', 'trailing-', 'double--hyphen'])(
      'rejects "%s"',
      (slug) => {
        expect(() => policy.assertSlug(slug)).toThrow(BadRequestException);
      },
    );
  });

  describe('assertPublishable', () => {
    it('throws when title is blank', () => {
      expect(() =>
        policy.assertPublishable({ title: '  ', contentMdx: 'body' }),
      ).toThrow(BadRequestException);
    });

    it('throws when content is blank', () => {
      expect(() =>
        policy.assertPublishable({ title: 'Hello', contentMdx: '\n\n' }),
      ).toThrow(BadRequestException);
    });

    it('passes when both fields are present', () => {
      expect(() =>
        policy.assertPublishable({ title: 'Hello', contentMdx: 'body' }),
      ).not.toThrow();
    });
  });

  describe('resolvePublishedAt', () => {
    it('returns a fresh timestamp for never-published posts', () => {
      const before = Date.now();
      const out = policy.resolvePublishedAt({
        publishedAt: null,
        status: BlogPostStatus.DRAFT,
      });
      expect(out.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('preserves an existing publishedAt on a re-publish', () => {
      const original = new Date('2025-01-01T00:00:00Z');
      const out = policy.resolvePublishedAt({
        publishedAt: original,
        status: BlogPostStatus.PUBLISHED,
      });
      expect(out).toBe(original);
    });
  });
});

import { BadRequestException } from '@nestjs/common';
import { PlaybookStatus } from '@prisma/client';
import { PlaybookPublishPolicy } from './playbook-publish.policy';

describe('PlaybookPublishPolicy', () => {
  const policy = new PlaybookPublishPolicy();

  describe('assertSlug', () => {
    it.each(['onboarding-guide', 'ai-playbook-2026', 'sales'])(
      'accepts URL-safe slug "%s"',
      (slug) => {
        expect(() => policy.assertSlug(slug)).not.toThrow();
      },
    );

    it.each(['Onboarding Guide', 'has_underscore', 'Trailing-', 'Hoa'])(
      'rejects invalid slug "%s"',
      (slug) => {
        expect(() => policy.assertSlug(slug)).toThrow(BadRequestException);
      },
    );
  });

  describe('assertPublishable', () => {
    it('passes when title and content are present', () => {
      expect(() =>
        policy.assertPublishable({ title: 'Guide', contentMdx: 'body' }),
      ).not.toThrow();
    });

    it('rejects blank title', () => {
      expect(() =>
        policy.assertPublishable({ title: '   ', contentMdx: 'body' }),
      ).toThrow(BadRequestException);
    });

    it('rejects blank content', () => {
      expect(() =>
        policy.assertPublishable({ title: 'Guide', contentMdx: '  ' }),
      ).toThrow(BadRequestException);
    });
  });

  describe('resolvePublishedAt', () => {
    it('preserves the original date when re-publishing', () => {
      const original = new Date('2026-01-01T00:00:00Z');
      const result = policy.resolvePublishedAt({
        status: PlaybookStatus.PUBLISHED,
        publishedAt: original,
      });
      expect(result).toBe(original);
    });

    it('stamps a fresh date when publishing a draft for the first time', () => {
      const before = Date.now();
      const result = policy.resolvePublishedAt({
        status: PlaybookStatus.DRAFT,
        publishedAt: null,
      });
      expect(result.getTime()).toBeGreaterThanOrEqual(before);
    });
  });
});

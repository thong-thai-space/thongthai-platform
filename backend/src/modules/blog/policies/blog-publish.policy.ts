import { BadRequestException, Injectable } from '@nestjs/common';
import { BlogPost, BlogPostStatus } from '@prisma/client';

/**
 * Pattern: Policy — guards what it takes to flip a post to PUBLISHED.
 *
 * Rules:
 *   - Title and content must be non-empty when publishing.
 *   - Slug must be lowercase alphanumeric + hyphens (URL-safe).
 *   - publishedAt is stamped to "now" the first time a post is published;
 *     subsequent publishes keep the original publishedAt (so re-publishing
 *     edits doesn't lie about the publication date).
 */
@Injectable()
export class BlogPublishPolicy {
  private static readonly SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  assertSlug(slug: string): void {
    if (!BlogPublishPolicy.SLUG_RE.test(slug)) {
      throw new BadRequestException(
        'Slug must be lowercase letters, numbers, and hyphens only',
      );
    }
  }

  assertPublishable(post: { title: string; contentMdx: string }): void {
    if (!post.title.trim()) {
      throw new BadRequestException('Cannot publish: title is required');
    }
    if (!post.contentMdx.trim()) {
      throw new BadRequestException('Cannot publish: content is required');
    }
  }

  /** Returns the new publishedAt value to write — preserves the existing one if any. */
  resolvePublishedAt(post: Pick<BlogPost, 'publishedAt' | 'status'>): Date {
    if (post.status === BlogPostStatus.PUBLISHED && post.publishedAt) {
      return post.publishedAt;
    }
    return new Date();
  }
}

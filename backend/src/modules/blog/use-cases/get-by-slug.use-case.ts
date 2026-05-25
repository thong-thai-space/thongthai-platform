import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogPost, BlogPostStatus, Language } from '@prisma/client';
import { BLOG_REPOSITORY } from '../blog.constants';
import type { BlogRepositoryPort } from '../domain/blog.repository.port';

// Pattern: Use Case — public detail route. Returns 404 for drafts and future-dated
// posts so the public API doesn't leak draft URLs.
@Injectable()
export class GetBlogPostBySlugUseCase {
  constructor(
    @Inject(BLOG_REPOSITORY)
    private readonly repo: BlogRepositoryPort,
  ) {}

  async execute(locale: Language, slug: string): Promise<BlogPost> {
    const post = await this.repo.findBySlug(locale, slug);
    if (
      !post ||
      post.status !== BlogPostStatus.PUBLISHED ||
      !post.publishedAt ||
      post.publishedAt > new Date()
    ) {
      throw new NotFoundException('Blog post not found');
    }
    return post;
  }
}

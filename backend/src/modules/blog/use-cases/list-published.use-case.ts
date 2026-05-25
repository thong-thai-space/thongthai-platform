import { Inject, Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import { BLOG_REPOSITORY } from '../blog.constants';
import type {
  BlogListResult,
  BlogRepositoryPort,
} from '../domain/blog.repository.port';

export interface ListPublishedInput {
  locale: Language;
  tag?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

// Pattern: Use Case — public-facing list (only PUBLISHED, only past publishedAt).
@Injectable()
export class ListPublishedBlogPostsUseCase {
  constructor(
    @Inject(BLOG_REPOSITORY)
    private readonly repo: BlogRepositoryPort,
  ) {}

  execute(input: ListPublishedInput): Promise<BlogListResult> {
    const page = Math.max(1, input.page ?? DEFAULT_PAGE);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    return this.repo.listPublished({
      locale: input.locale,
      tag: input.tag,
      page,
      pageSize,
    });
  }
}

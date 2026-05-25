import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogPostStatus, Language } from '@prisma/client';
import { BLOG_REPOSITORY } from '../blog.constants';
import type {
  AdminFilter,
  BlogRepositoryPort,
} from '../domain/blog.repository.port';
import { BlogPublishPolicy } from '../policies/blog-publish.policy';
import { CreateBlogPostDto } from '../dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../dto/update-blog-post.dto';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

// Pattern: Use Case bundle — admin CRUD lives in one class because the operations
// share a single concern (post lifecycle) and the same dependencies. Splitting
// each into its own class would be churn without benefit.
@Injectable()
export class BlogAdminUseCases {
  constructor(
    @Inject(BLOG_REPOSITORY)
    private readonly repo: BlogRepositoryPort,
    private readonly publishPolicy: BlogPublishPolicy,
  ) {}

  listAll(filter: Partial<AdminFilter>) {
    return this.repo.listAll({
      locale: filter.locale,
      status: filter.status,
      page: Math.max(1, filter.page ?? 1),
      pageSize: Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, filter.pageSize ?? DEFAULT_PAGE_SIZE),
      ),
    });
  }

  async getById(id: string) {
    const post = await this.repo.findById(id);
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async create(dto: CreateBlogPostDto, authorId: string) {
    this.publishPolicy.assertSlug(dto.slug);
    return this.repo.create({
      title: dto.title,
      slug: dto.slug,
      locale: dto.locale,
      excerpt: dto.excerpt,
      contentMdx: dto.contentMdx,
      coverImageUrl: dto.coverImageUrl,
      tags: dto.tags ?? [],
      status: BlogPostStatus.DRAFT,
      author: { connect: { id: authorId } },
    });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.getById(id);
    if (dto.slug && dto.slug !== existing.slug) {
      this.publishPolicy.assertSlug(dto.slug);
    }
    return this.repo.update(id, {
      title: dto.title ?? undefined,
      slug: dto.slug ?? undefined,
      excerpt: dto.excerpt ?? undefined,
      contentMdx: dto.contentMdx ?? undefined,
      coverImageUrl: dto.coverImageUrl ?? undefined,
      tags: dto.tags ?? undefined,
    });
  }

  async publish(id: string) {
    const existing = await this.getById(id);
    this.publishPolicy.assertPublishable(existing);
    return this.repo.update(id, {
      status: BlogPostStatus.PUBLISHED,
      publishedAt: this.publishPolicy.resolvePublishedAt(existing),
    });
  }

  async unpublish(id: string) {
    await this.getById(id);
    return this.repo.update(id, { status: BlogPostStatus.DRAFT });
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repo.delete(id);
  }

  /** Convenience for sitemap generation; bypasses paging. */
  listPublishedSlugs(locale?: Language) {
    return this.repo.listPublishedSlugs().then((items) =>
      locale ? items.filter((i) => i.locale === locale) : items,
    );
  }
}

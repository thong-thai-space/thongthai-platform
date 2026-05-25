import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import { ListPublishedBlogPostsUseCase } from './use-cases/list-published.use-case';
import { GetBlogPostBySlugUseCase } from './use-cases/get-by-slug.use-case';
import { BlogAdminUseCases } from './use-cases/admin.use-cases';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import {
  ListAdminBlogPostsQueryDto,
  ListPublishedBlogPostsQueryDto,
} from './dto/list-blog-posts.dto';

// Pattern: Facade — thin controller-facing API.
@Injectable()
export class BlogService {
  constructor(
    private readonly listPublished: ListPublishedBlogPostsUseCase,
    private readonly getBySlug: GetBlogPostBySlugUseCase,
    private readonly admin: BlogAdminUseCases,
  ) {}

  // Public
  listPublic(query: ListPublishedBlogPostsQueryDto) {
    return this.listPublished.execute({
      locale: query.locale ?? Language.VI,
      tag: query.tag,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  getPublicBySlug(locale: Language, slug: string) {
    return this.getBySlug.execute(locale, slug);
  }

  publicSitemapSlugs() {
    return this.admin.listPublishedSlugs();
  }

  // Admin
  listAdmin(query: ListAdminBlogPostsQueryDto) {
    return this.admin.listAll(query);
  }

  getAdminById(id: string) {
    return this.admin.getById(id);
  }

  create(dto: CreateBlogPostDto, authorId: string) {
    return this.admin.create(dto, authorId);
  }

  update(id: string, dto: UpdateBlogPostDto) {
    return this.admin.update(id, dto);
  }

  publish(id: string) {
    return this.admin.publish(id);
  }

  unpublish(id: string) {
    return this.admin.unpublish(id);
  }

  delete(id: string) {
    return this.admin.delete(id);
  }
}

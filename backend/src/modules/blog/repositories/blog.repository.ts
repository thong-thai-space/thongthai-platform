import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  BlogPost,
  BlogPostStatus,
  Language,
  Prisma,
} from '@prisma/client';
import {
  AdminFilter,
  BlogListResult,
  BlogRepositoryPort,
  PublishedFilter,
} from '../domain/blog.repository.port';

// Pattern: Repository
@Injectable()
export class BlogRepository implements BlogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(filter: PublishedFilter): Promise<BlogListResult> {
    const where: Prisma.BlogPostWhereInput = {
      locale: filter.locale,
      status: BlogPostStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
    };
    if (filter.tag) {
      where.tags = { has: filter.tag };
    }

    const skip = (filter.page - 1) * filter.pageSize;
    try {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.blogPost.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          skip,
          take: filter.pageSize,
        }),
        this.prisma.blogPost.count({ where }),
      ]);
      return { items, total, page: filter.page, pageSize: filter.pageSize };
    } catch {
      throw new InternalServerErrorException('Failed to list blog posts');
    }
  }

  async listAll(filter: AdminFilter): Promise<BlogListResult> {
    const where: Prisma.BlogPostWhereInput = {};
    if (filter.locale) where.locale = filter.locale;
    if (filter.status) where.status = filter.status;

    const skip = (filter.page - 1) * filter.pageSize;
    try {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.blogPost.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: filter.pageSize,
        }),
        this.prisma.blogPost.count({ where }),
      ]);
      return { items, total, page: filter.page, pageSize: filter.pageSize };
    } catch {
      throw new InternalServerErrorException('Failed to list blog posts');
    }
  }

  async findById(id: string): Promise<BlogPost | null> {
    try {
      return await this.prisma.blogPost.findUnique({ where: { id } });
    } catch {
      throw new InternalServerErrorException('Failed to fetch blog post');
    }
  }

  async findBySlug(locale: Language, slug: string): Promise<BlogPost | null> {
    try {
      return await this.prisma.blogPost.findUnique({
        where: { locale_slug: { locale, slug } },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch blog post');
    }
  }

  async create(data: Prisma.BlogPostCreateInput): Promise<BlogPost> {
    try {
      return await this.prisma.blogPost.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A blog post with that slug already exists for this locale');
      }
      throw new InternalServerErrorException('Failed to create blog post');
    }
  }

  async update(id: string, data: Prisma.BlogPostUpdateInput): Promise<BlogPost> {
    try {
      return await this.prisma.blogPost.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Blog post not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('A blog post with that slug already exists for this locale');
        }
      }
      throw new InternalServerErrorException('Failed to update blog post');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.blogPost.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Blog post not found');
      }
      throw new InternalServerErrorException('Failed to delete blog post');
    }
  }

  async listPublishedSlugs() {
    try {
      return await this.prisma.blogPost.findMany({
        where: {
          status: BlogPostStatus.PUBLISHED,
          publishedAt: { lte: new Date() },
        },
        select: { locale: true, slug: true, updatedAt: true },
      });
    } catch {
      throw new InternalServerErrorException('Failed to list published slugs');
    }
  }
}

import { BlogPost, BlogPostStatus, Language, Prisma } from '@prisma/client';

// Pattern: Repository Port
export interface BlogRepositoryPort {
  listPublished(filter: PublishedFilter): Promise<BlogListResult>;
  listAll(filter: AdminFilter): Promise<BlogListResult>;
  findById(id: string): Promise<BlogPost | null>;
  findBySlug(locale: Language, slug: string): Promise<BlogPost | null>;
  create(data: Prisma.BlogPostCreateInput): Promise<BlogPost>;
  update(id: string, data: Prisma.BlogPostUpdateInput): Promise<BlogPost>;
  delete(id: string): Promise<void>;
  /** Returns every published slug per locale — used by the sitemap. */
  listPublishedSlugs(): Promise<{ locale: Language; slug: string; updatedAt: Date }[]>;
}

export interface PublishedFilter {
  locale: Language;
  tag?: string;
  page: number;
  pageSize: number;
}

export interface AdminFilter {
  locale?: Language;
  status?: BlogPostStatus;
  page: number;
  pageSize: number;
}

export interface BlogListResult {
  items: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}

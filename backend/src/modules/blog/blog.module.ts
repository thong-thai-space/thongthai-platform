import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogRepository } from './repositories/blog.repository';
import { BlogPublishPolicy } from './policies/blog-publish.policy';
import { ListPublishedBlogPostsUseCase } from './use-cases/list-published.use-case';
import { GetBlogPostBySlugUseCase } from './use-cases/get-by-slug.use-case';
import { BlogAdminUseCases } from './use-cases/admin.use-cases';
import { BLOG_REPOSITORY } from './blog.constants';

// Pattern: Composition Root
@Module({
  imports: [AuthModule],
  controllers: [BlogController],
  providers: [
    BlogService,
    BlogRepository,
    BlogPublishPolicy,
    ListPublishedBlogPostsUseCase,
    GetBlogPostBySlugUseCase,
    BlogAdminUseCases,
    { provide: BLOG_REPOSITORY, useExisting: BlogRepository },
  ],
  exports: [BlogService],
})
export class BlogModule {}

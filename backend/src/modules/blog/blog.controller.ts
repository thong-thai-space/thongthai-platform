import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Language, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import {
  ListAdminBlogPostsQueryDto,
  ListPublishedBlogPostsQueryDto,
} from './dto/list-blog-posts.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Blog')
@Controller()
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ── Public ──
  @Get('blog')
  listPublic(@Query() query: ListPublishedBlogPostsQueryDto) {
    return this.blogService.listPublic(query);
  }

  @Get('blog/:locale/:slug')
  getPublic(
    @Param('locale') locale: Language,
    @Param('slug') slug: string,
  ) {
    return this.blogService.getPublicBySlug(locale, slug);
  }

  @Get('blog/sitemap')
  sitemap() {
    return this.blogService.publicSitemapSlugs();
  }

  // ── Admin ──
  @Get('admin/blog')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  listAdmin(@Query() query: ListAdminBlogPostsQueryDto) {
    return this.blogService.listAdmin(query);
  }

  @Get('admin/blog/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  getAdmin(@Param('id') id: string) {
    return this.blogService.getAdminById(id);
  }

  @Post('admin/blog')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  create(
    @Body() dto: CreateBlogPostDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.blogService.create(dto, req.user.id);
  }

  @Patch('admin/blog/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.update(id, dto);
  }

  @Post('admin/blog/:id/publish')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string) {
    return this.blogService.publish(id);
  }

  @Post('admin/blog/:id/unpublish')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id') id: string) {
    return this.blogService.unpublish(id);
  }

  @Delete('admin/blog/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.blogService.delete(id);
  }
}

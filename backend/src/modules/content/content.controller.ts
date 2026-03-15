import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ContentService } from './content.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get()
  findAll() {
    return this.contentService.findAll();
  }

  @Get(':section')
  findBySection(@Param('section') section: string) {
    return this.contentService.findBySection(section);
  }

  @Put(':section')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  upsert(
    @Param('section') section: string,
    @Body() body: { data: any; isActive?: boolean },
  ) {
    return this.contentService.upsert(section, body.data, body.isActive);
  }

  @Delete(':section')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  remove(@Param('section') section: string) {
    return this.contentService.remove(section);
  }

  @Post('seed')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  seed() {
    return this.contentService.seed();
  }

  @Post('upload-image')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/content',
        filename: (_req, file, cb) => {
          const uniqueName = `content-${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/content/${file.filename}` };
  }
}

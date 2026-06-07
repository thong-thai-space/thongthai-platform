import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ContentService } from './content.service';
import { UpdateOverrideDto } from './dto/update-override.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES } from './content.constants';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ── Public ── consumed by the frontend at render time (i18n/request.ts).
  @Get('overrides/:locale')
  getOverrides(@Param('locale') locale: string) {
    return this.contentService.getOverridesForLocale(locale);
  }

  // ── Admin ──
  @Get('admin/overrides/:locale')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  getAdminOverrides(@Param('locale') locale: string) {
    return this.contentService.getOverridesForLocale(locale);
  }

  @Put('admin/overrides/:locale/:namespace')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async upsertOverride(
    @Param('locale') locale: string,
    @Param('namespace') namespace: string,
    @Body() dto: UpdateOverrideDto,
  ) {
    await this.contentService.upsertOverride(locale, namespace, dto.data);
    return { success: true };
  }

  @Delete('admin/overrides/:locale/:namespace')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeOverride(
    @Param('locale') locale: string,
    @Param('namespace') namespace: string,
  ) {
    await this.contentService.removeOverride(locale, namespace);
    return { success: true };
  }

  // ── Images (shared across locales) ──
  @Put('admin/images/:namespace')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME.test(file.mimetype)) {
          return cb(
            new BadRequestException('Only JPEG, PNG, GIF, or WebP images are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  async uploadImage(
    @Param('namespace') namespace: string,
    @Body() dto: UploadImageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No image file provided');
    return this.contentService.setImage(namespace, dto.field, file);
  }

  @Delete('admin/images/:namespace')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeImage(
    @Param('namespace') namespace: string,
    @Query('field') field: string,
  ) {
    if (!field) throw new BadRequestException('Missing image field');
    await this.contentService.removeImage(namespace, field);
    return { success: true };
  }
}

import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PortfolioService } from './portfolio.service';
import { UpdatePortfolioDto } from './dto/portfolio.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  getShowcase() {
    return this.portfolioService.getShowcase();
  }

  @Patch(':projectId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  updateShowcase(
    @Param('projectId') projectId: string,
    @Body() dto: UpdatePortfolioDto,
  ) {
    return this.portfolioService.updateShowcase(projectId, dto);
  }

  @Post(':projectId/thumbnail')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: diskStorage({
        destination: './uploads/portfolio',
        filename: (_req, file, cb) => {
          const uniqueName = `portfolio-${Date.now()}${extname(file.originalname)}`;
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
  async uploadThumbnail(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    return this.portfolioService.updateShowcase(projectId, {
      thumbnailUrl: `/uploads/portfolio/${file.filename}`,
    });
  }
}

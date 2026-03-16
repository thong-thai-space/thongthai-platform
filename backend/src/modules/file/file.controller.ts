import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { FileService } from './file.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('files')
export class FileController {
  constructor(private fileService: FileService) {}

  @Get()
  findByProject(@Query('projectId') projectId: string) {
    return this.fileService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileService.findOne(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!projectId) throw new BadRequestException('projectId is required');

    return this.fileService.uploadProjectFile({
      file,
      projectId,
      uploadedBy: userId,
      role,
    });
  }

  @Post('metadata')
  createMetadata(
    @Body()
    body: {
      name: string;
      url: string;
      mimeType: string;
      size: number;
      projectId: string;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.fileService.create({ ...body, uploadedBy: userId });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileService.remove(id);
  }
}

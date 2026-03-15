import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  create(
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

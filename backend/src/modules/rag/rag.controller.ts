import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { RagService } from './rag.service';
import {
  IngestTextDto,
  ListDocumentsQueryDto,
  QueryKnowledgeDto,
  ReviewAnswerDto,
  UploadDocumentDto,
} from './dto/rag.dto';
import { MAX_UPLOAD_BYTES } from './rag.constants';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

/**
 * Staff-facing RAG API (OWNER/ADMIN): ingest a client's documents, query their
 * knowledge base, and review the AI's draft answers. Client-facing delivery of
 * APPROVED answers is a later increment.
 */
@ApiTags('RAG')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('documents')
  ingest(@Body() dto: IngestTextDto, @CurrentUser('id') userId: string) {
    return this.ragService.ingestText({
      clientId: dto.clientId,
      uploadedById: userId,
      title: dto.title,
      text: dto.text,
    });
  }

  @Post('documents/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  uploadDocument(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.ragService.ingestFile({
      clientId: dto.clientId,
      uploadedById: userId,
      title: dto.title?.trim() || file.originalname,
      file: {
        buffer: file.buffer,
        mimeType: file.mimetype,
        filename: file.originalname,
      },
    });
  }

  @Get('documents')
  list(@Query() query: ListDocumentsQueryDto) {
    return this.ragService.listDocuments(query.clientId);
  }

  @Post('query')
  query(@Body() dto: QueryKnowledgeDto, @CurrentUser('id') userId: string) {
    return this.ragService.query({
      clientId: dto.clientId,
      askedById: userId,
      question: dto.question,
      topK: dto.topK,
    });
  }

  @Post('answers/:id/review')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewAnswerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ragService.review(id, dto.decision, userId);
  }
}

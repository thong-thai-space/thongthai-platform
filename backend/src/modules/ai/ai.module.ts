import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiPublicController } from './ai-public.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { FileParserService } from './services/file-parser.service';
import { DocxGeneratorService } from './services/docx-generator.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [AiController, AiPublicController],
  providers: [AiService, FileParserService, DocxGeneratorService],
  exports: [AiService],
})
export class AiModule {}

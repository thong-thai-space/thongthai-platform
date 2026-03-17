import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiPublicController } from './ai-public.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { DocumentService } from './document/document.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [AiController, AiPublicController],
  providers: [AiService, DocumentService],
  exports: [AiService],
})
export class AiModule {}

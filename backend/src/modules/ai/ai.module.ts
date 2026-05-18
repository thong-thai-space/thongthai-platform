import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiPublicController } from './ai-public.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { FileParserService } from './services/file-parser.service';
import { DocxGeneratorService } from './services/docx-generator.service';
import { AiUseCases } from './use-cases/ai.use-cases';
import { AiPolicy } from './policies/ai.policy';
import { AiRepository } from './repositories/ai.repository';
import { AiNotificationAdapter } from './adapters/ai-notification.adapter';
import { AiProviderAdapter } from './adapters/ai-provider.adapter';
import { AI_NOTIFICATION_PORT, AI_PROVIDER_PORT, AI_REPOSITORY } from './ai.constants';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [AiController, AiPublicController],
  providers: [
    AiService,
    AiUseCases,
    AiPolicy,
    AiRepository,
    AiNotificationAdapter,
    AiProviderAdapter,
    FileParserService,
    DocxGeneratorService,
    { provide: AI_REPOSITORY, useExisting: AiRepository },
    { provide: AI_NOTIFICATION_PORT, useExisting: AiNotificationAdapter },
    { provide: AI_PROVIDER_PORT, useExisting: AiProviderAdapter },
  ],
  exports: [AiService],
})
export class AiModule {}

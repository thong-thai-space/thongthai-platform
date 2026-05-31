import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiPublicController } from './ai-public.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { FileParserService } from './services/file-parser.service';
import { DocxGeneratorService } from './services/docx-generator.service';
import { AiPolicy } from './policies/ai.policy';
import { AiRepository } from './repositories/ai.repository';
import { AiNotificationAdapter } from './adapters/ai-notification.adapter';
import { AiProviderAdapter } from './adapters/ai-provider.adapter';
import {
  AI_NOTIFICATION_PORT,
  AI_PROVIDER_PORT,
  AI_REPOSITORY,
} from './ai.constants';
import { AiAuditService } from './support/ai-audit.service';
import { AiPromptConfigService } from './support/ai-prompt-config.service';
import { AiArchitectureUseCase } from './use-cases/ai-architecture.use-case';
import { AiAuditUseCase } from './use-cases/ai-audit.use-case';
import { AiChatUseCase } from './use-cases/ai-chat.use-case';
import { AiGenerationUseCase } from './use-cases/ai-generation.use-case';
import { AiPublicChatUseCase } from './use-cases/ai-public-chat.use-case';
import { AiStrategicPlanUseCase } from './use-cases/ai-strategic-plan.use-case';

// Pattern: Composition Root — wires ports to adapters and use cases
@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [AiController, AiPublicController],
  providers: [
    AiService,

    // Use cases (one per cohesive flow)
    AiArchitectureUseCase,
    AiAuditUseCase,
    AiChatUseCase,
    AiGenerationUseCase,
    AiPublicChatUseCase,
    AiStrategicPlanUseCase,

    // Shared support services
    AiAuditService,
    AiPromptConfigService,

    // Domain helpers
    AiPolicy,
    FileParserService,
    DocxGeneratorService,

    // Concrete adapters + port bindings
    AiRepository,
    AiNotificationAdapter,
    AiProviderAdapter,
    { provide: AI_REPOSITORY, useExisting: AiRepository },
    { provide: AI_NOTIFICATION_PORT, useExisting: AiNotificationAdapter },
    { provide: AI_PROVIDER_PORT, useExisting: AiProviderAdapter },
  ],
  // AI_PROVIDER_PORT is exported so the RAG module can reuse the LLM provider
  // for grounded answer generation (its Provider Router stays the single seam).
  exports: [AiService, AI_PROVIDER_PORT],
})
export class AiModule {}

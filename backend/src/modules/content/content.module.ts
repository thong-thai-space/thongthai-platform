import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import {
  CONTENT_REPOSITORY,
  CONTENT_SECTION_VALIDATOR,
} from './content.constants';
import { ContentRepository } from './repositories/content.repository';
import { ContentSectionValidator } from './policies/content-section-validator.policy';
import { ContentUseCases } from './use-cases/content.use-cases';

// Pattern: Composition Root — ports bound to concrete adapters here
@Module({
  imports: [StorageModule],
  controllers: [ContentController],
  providers: [
    ContentService,
    ContentUseCases,
    ContentRepository,
    ContentSectionValidator,
    { provide: CONTENT_REPOSITORY, useExisting: ContentRepository },
    { provide: CONTENT_SECTION_VALIDATOR, useExisting: ContentSectionValidator },
  ],
  exports: [ContentService],
})
export class ContentModule {}

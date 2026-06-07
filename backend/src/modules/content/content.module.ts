import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../../shared/storage/storage.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentUseCases } from './use-cases/content.use-cases';
import { ContentRepository } from './repositories/content.repository';
import { ContentOverridePolicy } from './policies/content-override.policy';
import { CONTENT_REPOSITORY } from './content.constants';

// Pattern: Composition Root — binds the repository port to its Prisma adapter.
@Module({
  imports: [AuthModule, StorageModule],
  controllers: [ContentController],
  providers: [
    ContentService,
    ContentUseCases,
    ContentRepository,
    ContentOverridePolicy,
    { provide: CONTENT_REPOSITORY, useExisting: ContentRepository },
  ],
  exports: [ContentService],
})
export class ContentModule {}

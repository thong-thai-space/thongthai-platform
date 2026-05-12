import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentRepository } from './repositories/content.repository';

@Module({
  imports: [StorageModule],
  controllers: [ContentController],
  providers: [ContentService, ContentRepository],
  exports: [ContentService],
})
export class ContentModule {}

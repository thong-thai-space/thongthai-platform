import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [StorageModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

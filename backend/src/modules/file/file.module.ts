import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FileRepository } from './repositories/file.repository';

@Module({
  imports: [StorageModule],
  controllers: [FileController],
  providers: [FileService, FileRepository],
  exports: [FileService],
})
export class FileModule {}

import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { FileService } from './file.service';
import { FileController } from './file.controller';

@Module({
  imports: [StorageModule],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}

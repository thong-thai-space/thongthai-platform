import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileUseCases } from './use-cases/file.use-cases';
import { FileRepository } from './repositories/file.repository';
import { R2FileStorageAdapter } from './adapters/r2-file-storage.adapter';
import { ProjectAccessPolicy } from './policies/project-access.policy';
import { FILE_REPOSITORY, FILE_STORAGE } from './file.constants';

// Pattern: Composition Root — wires ports to adapters here
@Module({
  imports: [StorageModule],
  controllers: [FileController],
  providers: [
    FileService,
    FileUseCases,
    FileRepository,
    R2FileStorageAdapter,
    ProjectAccessPolicy,
    { provide: FILE_REPOSITORY, useExisting: FileRepository },
    { provide: FILE_STORAGE, useExisting: R2FileStorageAdapter },
  ],
  exports: [FileService],
})
export class FileModule {}

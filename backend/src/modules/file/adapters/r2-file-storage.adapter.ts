import { Injectable } from '@nestjs/common';
import { R2StorageService } from '../../../shared/storage/r2-storage.service';
import type { FileStoragePort, FileUploadFolder } from '../domain/file.storage.port';

// Pattern: Adapter — wraps R2StorageService behind FileStoragePort
@Injectable()
export class R2FileStorageAdapter implements FileStoragePort {
  constructor(private readonly r2: R2StorageService) {}

  uploadPublicFile(input: {
    folder: FileUploadFolder;
    file: Express.Multer.File;
    keyPrefix?: string;
  }): Promise<string> {
    // R2StorageService has its own internal UploadFolder type with the same literal
    // values. This adapter is the single boundary that translates between the two.
    return this.r2.uploadPublicFile(
      input as Parameters<R2StorageService['uploadPublicFile']>[0],
    );
  }
}

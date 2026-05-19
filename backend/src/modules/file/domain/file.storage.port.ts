export type FileUploadFolder = 'avatars' | 'content' | 'portfolio' | 'project-files';

// Pattern: Strategy Port — abstract over R2 / local / S3-compatible storage
export interface FileStoragePort {
  uploadPublicFile(input: {
    folder: FileUploadFolder;
    file: Express.Multer.File;
    keyPrefix?: string;
  }): Promise<string>;
}

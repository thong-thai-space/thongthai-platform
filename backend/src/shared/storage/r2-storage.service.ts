import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname } from 'path';
import { join } from 'path';
import { dirname } from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3') as {
  PutObjectCommand: new (input: Record<string, unknown>) => unknown;
  S3Client: new (input: Record<string, unknown>) => {
    send(command: unknown): Promise<unknown>;
  };
};

type UploadFolder = 'avatars' | 'content' | 'portfolio' | 'project-files';

@Injectable()
export class R2StorageService implements OnModuleInit {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly storageProvider: 'local' | 'r2';
  private readonly client: {
    send(command: unknown): Promise<unknown>;
  } | null;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.storageProvider =
      this.configService.get<'local' | 'r2'>('STORAGE_PROVIDER') || 'local';

    const accountId = this.configService.get<string>('R2_ACCOUNT_ID')?.trim();
    const accessKeyId = this.configService
      .get<string>('R2_ACCESS_KEY_ID')
      ?.trim();
    const secretAccessKey = this.configService
      .get<string>('R2_SECRET_ACCESS_KEY')
      ?.trim();
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME')?.trim() || '';
    const rawPublicBaseUrl = this.configService
      .get<string>('R2_PUBLIC_URL')
      ?.trim();
    this.publicBaseUrl = rawPublicBaseUrl
      ? rawPublicBaseUrl.replace(/\/$/, '')
      : '';

    if (
      !accountId ||
      !accessKeyId ||
      !secretAccessKey ||
      !this.bucketName ||
      !this.publicBaseUrl
    ) {
      this.client = null;
      return;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  onModuleInit() {
    if (this.storageProvider === 'local') {
      this.logger.log('Storage provider: local filesystem (/uploads)');
      return;
    }

    if (!this.client) {
      this.logger.warn(
        'Storage provider set to r2 but R2 config is incomplete, falling back to local filesystem (/uploads)',
      );
      return;
    }

    this.logger.log(`R2 storage enabled for bucket: ${this.bucketName}`);
    this.logger.log(`R2 public URL: ${this.publicBaseUrl}`);
  }

  async uploadPublicFile({
    folder,
    file,
    keyPrefix,
  }: {
    folder: UploadFolder;
    file: Express.Multer.File;
    keyPrefix?: string;
  }) {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const extension =
      extname(file.originalname || '') ||
      this.getExtensionFromMime(file.mimetype);
    const prefix = keyPrefix ? `${this.sanitizeSegment(keyPrefix)}-` : '';
    const key = `${folder}/${prefix}${Date.now()}-${randomUUID()}${extension}`;

    if (
      this.storageProvider === 'local' ||
      !this.client ||
      !this.bucketName ||
      !this.publicBaseUrl
    ) {
      return this.uploadToLocal(key, file.buffer);
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return `${this.publicBaseUrl}/${key}`;
  }

  private async uploadToLocal(key: string, buffer: Buffer) {
    const normalizedKey = key.replace('project-files/', 'files/');
    const outputPath = join(process.cwd(), 'uploads', normalizedKey);
    const outputDir = dirname(outputPath);

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, buffer);

    return `/uploads/${normalizedKey.replace(/\\/g, '/')}`;
  }

  private sanitizeSegment(value: string) {
    return value.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 64) || 'file';
  }

  private getExtensionFromMime(mimeType: string) {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };

    return extensions[mimeType] || '';
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
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

    // SECURITY: derive the stored extension from the (server-validated) MIME
    // type ONLY — NEVER from `file.originalname`, which is attacker-controlled.
    // Previously a client could upload a file with `Content-Type: application/pdf`
    // (passing the multer fileFilter) but `originalname: "evil.html"`. The file
    // was saved as `evil-…html` and served by `useStaticAssets` with
    // `Content-Type: text/html` (Express infers from extension), producing a
    // stored XSS on the API origin. By dropping originalname here and refusing
    // any MIME we don't have a safe mapping for, the stored extension matches
    // the declared content type.
    const extension = this.getExtensionFromMime(file.mimetype);
    if (!extension) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not supported`,
      );
    }
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

  // SECURITY: this is the single source of truth for what we accept and how
  // we name it on disk / object storage. Adding a row here is an explicit
  // decision that the type is safe to serve from our origin.
  // Anything NOT in this map is rejected upstream — no extension is taken
  // from `originalname` (attacker-controlled).
  private static readonly SAFE_EXTENSION_BY_MIME: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      '.xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      '.pptx',
    'text/plain': '.txt',
    'text/csv': '.csv',
  };

  private getExtensionFromMime(mimeType: string): string | null {
    return R2StorageService.SAFE_EXTENSION_BY_MIME[mimeType] ?? null;
  }
}

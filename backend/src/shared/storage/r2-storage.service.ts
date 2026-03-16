import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3') as {
  PutObjectCommand: new (input: Record<string, unknown>) => unknown;
  S3Client: new (input: Record<string, unknown>) => {
    send(command: unknown): Promise<unknown>;
  };
};

type UploadFolder = 'avatars' | 'content' | 'portfolio' | 'project-files';

@Injectable()
export class R2StorageService {
  private readonly client: {
    send(command: unknown): Promise<unknown>;
  } | null;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID')?.trim();
    const accessKeyId = this.configService
      .get<string>('R2_ACCESS_KEY_ID')
      ?.trim();
    const secretAccessKey = this.configService
      .get<string>('R2_SECRET_ACCESS_KEY')
      ?.trim();
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME')?.trim() || '';
    this.publicBaseUrl =
      this.configService
        .get<string>('R2_PUBLIC_URL')
        ?.trim()
        .replace(/\/$/, '') || '';

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

  async uploadPublicFile({
    folder,
    file,
    keyPrefix,
  }: {
    folder: UploadFolder;
    file: Express.Multer.File;
    keyPrefix?: string;
  }) {
    if (!this.client || !this.bucketName || !this.publicBaseUrl) {
      throw new InternalServerErrorException(
        'Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL.',
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const extension =
      extname(file.originalname || '') ||
      this.getExtensionFromMime(file.mimetype);
    const prefix = keyPrefix ? `${this.sanitizeSegment(keyPrefix)}-` : '';
    const key = `${folder}/${prefix}${Date.now()}-${randomUUID()}${extension}`;

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

import {
  IsInt,
  IsMimeType,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FILE_UPLOAD_LIMITS } from '../file.constants';

// SECURITY: Strongly-typed DTO so the global ValidationPipe
// (whitelist + forbidNonWhitelisted) strips unknown properties and
// rejects anything that does not match the expected shape. Previously
// the controller accepted a raw object literal which bypassed the
// validation pipe entirely.
export class CreateFileMetadataDto {
  @IsString()
  @MaxLength(255)
  name: string;

  // SECURITY: only http(s) URLs are accepted — this prevents an attacker
  // from storing `javascript:` (or `data:` / `vbscript:` / etc.) payloads
  // that would execute when the frontend renders the file as a link.
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: true,
  })
  @MaxLength(2048)
  url: string;

  @IsMimeType()
  @MaxLength(255)
  mimeType: string;

  @IsInt()
  @Min(0)
  @Max(FILE_UPLOAD_LIMITS.MAX_BYTES)
  size: number;

  // Prisma uses cuid (24-30 chars depending on entropy / variant).
  @IsString()
  @Length(1, 64)
  projectId: string;
}

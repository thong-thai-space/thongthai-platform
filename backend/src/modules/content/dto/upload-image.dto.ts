import { IsNotEmpty, IsString } from 'class-validator';

export class UploadImageDto {
  // Dotted image-field path within the namespace, e.g. "imageUrl" or
  // "items.web.imageUrl". Validated against the allowlist by the policy.
  @IsString()
  @IsNotEmpty()
  field!: string;
}

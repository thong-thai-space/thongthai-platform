import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Language } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEnum(Language)
  locale?: Language;
}

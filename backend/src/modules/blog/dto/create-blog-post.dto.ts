import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Language } from '@prisma/client';

export class CreateBlogPostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  slug: string;

  @IsNotEmpty()
  @IsEnum(Language)
  locale: Language;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsNotEmpty()
  @IsString()
  contentMdx: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

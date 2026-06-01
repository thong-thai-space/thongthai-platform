import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePlaybookDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsNotEmpty()
  @IsString()
  contentMdx: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

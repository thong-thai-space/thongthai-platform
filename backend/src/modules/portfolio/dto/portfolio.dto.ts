import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';

export class UpdatePortfolioDto {
  @IsOptional()
  @IsBoolean()
  isShowcase?: boolean;

  @IsOptional()
  @IsNumber()
  showcaseOrder?: number;

  @IsOptional()
  @IsString()
  showcaseCategory?: string;

  @IsOptional()
  @IsString()
  showcaseResults?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenshots?: string[];
}

import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Currency } from '@prisma/client';

export class CreateProjectRequestDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];
}

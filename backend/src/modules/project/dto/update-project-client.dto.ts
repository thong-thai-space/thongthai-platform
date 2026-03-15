import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';
import { Currency } from '@prisma/client';

export class UpdateProjectClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  currency?: Currency;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];
}

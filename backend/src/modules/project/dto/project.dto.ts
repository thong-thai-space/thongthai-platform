import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { ProjectStatus, Currency } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsNumber()
  budgetUsd?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];

  @IsOptional()
  @IsString()
  repoUrl?: string;

  @IsOptional()
  @IsString()
  liveUrl?: string;

  @IsOptional()
  @IsString()
  figmaUrl?: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsBoolean()
  isShowcase?: boolean;

  @IsOptional()
  @IsNumber()
  showcaseOrder?: number;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenshots?: string[];
}

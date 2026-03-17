import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsObject,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Language } from '@prisma/client';

export class ChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class GenerateProposalDto {
  @IsString()
  requirements: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsEnum(Language)
  locale?: Language;
}

export class BreakdownTasksDto {
  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  techStack: string[];
}

export class ReviewCodeDto {
  @IsString()
  code: string;

  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  context?: string;
}

export class EstimateDto {
  @IsString()
  requirements: string;

  @IsOptional()
  @IsEnum(Language)
  locale?: Language;
}

export class StrategicPlanDto {
  @IsString()
  objective: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  constraints?: string;

  @IsOptional()
  @IsEnum(Language)
  locale?: Language;

  @IsOptional()
  @IsBoolean()
  includeRiskMatrix?: boolean;
}

export class ApplyStrategicPlanDto {
  @IsString()
  projectId: string;

  @IsObject()
  plan: Record<string, unknown>;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  constraints?: string;
}

export class ReviewApplyRequestDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AuditQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;
}

export class PurgeAuditDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  retentionDays?: number;
}

export class ExportDocumentDto {
  @IsString()
  format: string;

  content: unknown;

  @IsOptional()
  @IsString()
  projectName?: string;

  @IsOptional()
  @IsEnum(Language)
  locale?: Language;
}

export class AiAuditFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  effectivenessScore: number;

  @IsOptional()
  @IsString()
  feedbackNote?: string;
}

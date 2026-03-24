import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsIn,
  IsBoolean,
  IsObject,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Language } from '@prisma/client';

export const AI_MODEL_OPTIONS = [
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219',
  'claude-opus-4-20250514',
] as const;

export type AiModel = (typeof AI_MODEL_OPTIONS)[number];

export class ChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsIn(AI_MODEL_OPTIONS)
  model?: AiModel;
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

  @IsOptional()
  @IsIn(AI_MODEL_OPTIONS)
  model?: AiModel;
}

export class BreakdownTasksDto {
  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @IsOptional()
  @IsIn(AI_MODEL_OPTIONS)
  model?: AiModel;
}

export class ReviewCodeDto {
  @IsString()
  code: string;

  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsIn(AI_MODEL_OPTIONS)
  model?: AiModel;
}

export class EstimateDto {
  @IsString()
  requirements: string;

  @IsOptional()
  @IsEnum(Language)
  locale?: Language;

  @IsOptional()
  @IsIn(AI_MODEL_OPTIONS)
  model?: AiModel;
}

export class ProgressReportDto {
  @IsOptional()
  @IsEnum(Language)
  locale?: Language;

  @IsOptional()
  @IsIn(AI_MODEL_OPTIONS)
  model?: AiModel;
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

  @IsOptional()
  @IsIn(AI_MODEL_OPTIONS)
  model?: AiModel;
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

export class AiAuditFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  effectivenessScore: number;

  @IsOptional()
  @IsString()
  feedbackNote?: string;
}

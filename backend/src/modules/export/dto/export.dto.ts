import { IsEnum, IsObject, IsOptional } from 'class-validator';

export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
}

export class ExportRequestDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

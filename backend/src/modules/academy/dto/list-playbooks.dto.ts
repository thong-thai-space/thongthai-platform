import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PlaybookStatus } from '@prisma/client';

export class ListAdminPlaybooksQueryDto {
  @IsOptional()
  @IsEnum(PlaybookStatus)
  status?: PlaybookStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

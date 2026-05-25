import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ContactRequestStatus } from '@prisma/client';

export class ListLeadsQueryDto {
  @IsOptional()
  @IsEnum(ContactRequestStatus)
  status?: ContactRequestStatus;

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

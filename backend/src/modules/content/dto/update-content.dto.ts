import { IsDefined, IsOptional, IsBoolean } from 'class-validator';
import { Prisma } from '@prisma/client';

export class UpdateContentDto {
  @IsDefined()
  data: Prisma.InputJsonValue;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

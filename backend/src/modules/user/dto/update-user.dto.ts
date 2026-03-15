import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { UserRole, Language } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(Language)
  locale?: Language;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

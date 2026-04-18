import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Language, MotionPreference } from '@prisma/client';

export class UpdateProfileDto {
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
  @IsEnum(Language)
  locale?: Language;

  @IsOptional()
  @IsEnum(MotionPreference)
  motionPreference?: MotionPreference;
}

import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  Equals,
  Matches,
} from 'class-validator';
import { UserRole, Language } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(Language)
  locale?: Language;

  @IsBoolean()
  @Equals(true, { message: 'You must accept Terms and Privacy Policy' })
  acceptTerms: boolean;

  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

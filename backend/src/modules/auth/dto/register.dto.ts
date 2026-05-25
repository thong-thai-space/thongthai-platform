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
import { Language } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
    },
  )
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // SECURITY: `role` is intentionally NOT exposed here.
  // Self-registered users are always created as CLIENT (the Prisma default);
  // staff (OWNER/ADMIN/MEMBER) must be provisioned through the authenticated
  // POST /users/members invitation flow.

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

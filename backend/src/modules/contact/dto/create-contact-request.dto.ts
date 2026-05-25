import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  // Cloudflare Turnstile token. Required only when TURNSTILE_SECRET_KEY is set
  // on the server — the policy treats an unset env as "challenge disabled" so
  // the field stays optional at the DTO layer.
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

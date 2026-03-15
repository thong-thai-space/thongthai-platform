import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

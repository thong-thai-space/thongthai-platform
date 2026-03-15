import { IsString, IsOptional, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

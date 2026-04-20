import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTurnstileDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

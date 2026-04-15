import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ArchitectureAgentDto {
  @IsString()
  @MaxLength(12000)
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

import { IsString, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsString()
  receiverId: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}

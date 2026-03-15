import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateContentDto {
  @IsString()
  section: string;

  data: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

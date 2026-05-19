import { IsBoolean, IsDefined, IsObject, IsOptional } from 'class-validator';

export class UpdateContentDto {
  // Pattern: Validation - Reject arrays/primitives at boundary; deeper shape is enforced
  // by ContentSectionValidator policy.
  @IsDefined()
  @IsObject()
  data: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { IsBoolean, IsDefined, IsObject, IsOptional } from 'class-validator';

export class UpdateContentDto {
  /**
   * Per-locale envelope: `{ vi?: Body | null, en?: Body | null }`. At least one locale
   * must be present. Deeper shape is enforced by ContentSectionValidator policy at the
   * use-case layer.
   *
   * The use case merges this partial with any existing record, so admins can save one
   * locale at a time without overwriting the other.
   */
  @IsDefined()
  @IsObject()
  data: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

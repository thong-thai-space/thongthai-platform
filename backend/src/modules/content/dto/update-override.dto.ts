import { IsDefined, IsObject } from 'class-validator';

export class UpdateOverrideDto {
  // Deep-partial override payload for one namespace. Structural validation
  // (allowed value types, depth, size) is enforced by ContentOverridePolicy.
  @IsDefined()
  @IsObject()
  data!: Record<string, unknown>;
}

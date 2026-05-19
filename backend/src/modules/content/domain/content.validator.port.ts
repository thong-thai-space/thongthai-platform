import type { ContentPayload } from './content.types';

// Pattern: Strategy Port — pluggable validation, can be swapped for Zod/JSONSchema later
export interface ContentSectionValidatorPort {
  validate(section: string, data: unknown): asserts data is ContentPayload;
}

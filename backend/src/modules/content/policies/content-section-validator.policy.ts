import { BadRequestException, Injectable } from '@nestjs/common';
import {
  KNOWN_CONTENT_SECTIONS,
  MAX_CONTENT_PAYLOAD_BYTES,
  type KnownContentSection,
} from '../content.constants';
import type { ContentPayload } from '../domain/content.types';
import type { ContentSectionValidatorPort } from '../domain/content.validator.port';

const KNOWN_SET = new Set<string>(KNOWN_CONTENT_SECTIONS);

// Pattern: Strategy — central place for section + payload validation rules
@Injectable()
export class ContentSectionValidator implements ContentSectionValidatorPort {
  validate(section: string, data: unknown): asserts data is ContentPayload {
    this.assertKnownSection(section);
    this.assertPlainObject(data);
    this.assertWithinSizeLimit(data);
  }

  private assertKnownSection(section: string): asserts section is KnownContentSection {
    if (!KNOWN_SET.has(section)) {
      throw new BadRequestException(`Unknown content section: "${section}"`);
    }
  }

  private assertPlainObject(data: unknown): asserts data is Record<string, unknown> {
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      throw new BadRequestException(
        'Content payload must be a JSON object (not an array or primitive)',
      );
    }
  }

  private assertWithinSizeLimit(data: unknown): void {
    let serialized: string;
    try {
      serialized = JSON.stringify(data);
    } catch {
      throw new BadRequestException('Content payload must be JSON-serializable');
    }
    if (Buffer.byteLength(serialized, 'utf8') > MAX_CONTENT_PAYLOAD_BYTES) {
      throw new BadRequestException(
        `Content payload exceeds ${MAX_CONTENT_PAYLOAD_BYTES} bytes`,
      );
    }
  }
}

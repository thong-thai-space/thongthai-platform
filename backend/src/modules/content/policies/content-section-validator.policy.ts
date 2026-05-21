import { BadRequestException, Injectable } from '@nestjs/common';
import {
  KNOWN_CONTENT_SECTIONS,
  MAX_CONTENT_PAYLOAD_BYTES,
  type KnownContentSection,
} from '../content.constants';
import {
  SUPPORTED_LOCALES,
  type ContentPayload,
  type Locale,
  type LocalizedContentPayload,
} from '../domain/content.types';
import type { ContentSectionValidatorPort } from '../domain/content.validator.port';

const KNOWN_SET = new Set<string>(KNOWN_CONTENT_SECTIONS);
const LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

// Pattern: Strategy — central place for section + per-locale payload validation rules
@Injectable()
export class ContentSectionValidator implements ContentSectionValidatorPort {
  validate(section: string, data: unknown): asserts data is ContentPayload {
    this.assertKnownSection(section);
    this.assertPlainObject(data);
    this.assertLocaleEnvelope(data);
    this.assertWithinSizeLimit(data);
  }

  private assertKnownSection(
    section: string,
  ): asserts section is KnownContentSection {
    if (!KNOWN_SET.has(section)) {
      throw new BadRequestException(`Unknown content section: "${section}"`);
    }
  }

  private assertPlainObject(
    data: unknown,
  ): asserts data is Record<string, unknown> {
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      throw new BadRequestException(
        'Content payload must be a JSON object (not an array or primitive)',
      );
    }
  }

  /**
   * Top-level shape must be `{ vi?: Body | null, en?: Body | null }`.
   * At least one locale must be present (else there's nothing to save).
   * Each locale's body, if non-null, must itself be a plain object.
   */
  private assertLocaleEnvelope(
    data: Record<string, unknown>,
  ): asserts data is LocalizedContentPayload {
    const keys = Object.keys(data);
    const localeKeys = keys.filter((k) => LOCALE_SET.has(k));

    if (localeKeys.length === 0) {
      throw new BadRequestException(
        `Content payload must include at least one locale key: ${SUPPORTED_LOCALES.join(' | ')}`,
      );
    }

    const unknownKeys = keys.filter((k) => !LOCALE_SET.has(k));
    if (unknownKeys.length > 0) {
      throw new BadRequestException(
        `Content payload contains unknown top-level keys: ${unknownKeys.join(', ')}. ` +
          `Allowed keys: ${SUPPORTED_LOCALES.join(', ')}`,
      );
    }

    for (const locale of localeKeys as Locale[]) {
      const body = data[locale];
      if (body === null || body === undefined) continue; // null is allowed → falls back to i18n
      if (typeof body !== 'object' || Array.isArray(body)) {
        throw new BadRequestException(
          `Locale "${locale}" body must be a JSON object or null`,
        );
      }
    }
  }

  private assertWithinSizeLimit(data: unknown): void {
    let serialized: string;
    try {
      serialized = JSON.stringify(data);
    } catch {
      throw new BadRequestException(
        'Content payload must be JSON-serializable',
      );
    }
    if (Buffer.byteLength(serialized, 'utf8') > MAX_CONTENT_PAYLOAD_BYTES) {
      throw new BadRequestException(
        `Content payload exceeds ${MAX_CONTENT_PAYLOAD_BYTES} bytes`,
      );
    }
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONTENT_REPOSITORY,
  CONTENT_SECTION_VALIDATOR,
} from '../content.constants';
import type { ContentRepositoryPort } from '../domain/content.repository.port';
import type { ContentSectionValidatorPort } from '../domain/content.validator.port';
import {
  SUPPORTED_LOCALES,
  type ContentPayload,
  type ContentRecord,
  type Locale,
  type LocalizedContentPayload,
} from '../domain/content.types';
import { DEFAULT_CONTENT } from '../content.seed';

// Pattern: Use Case — owns CMS read/write logic
@Injectable()
export class ContentUseCases {
  constructor(
    @Inject(CONTENT_REPOSITORY)
    private readonly repo: ContentRepositoryPort,
    @Inject(CONTENT_SECTION_VALIDATOR)
    private readonly validator: ContentSectionValidatorPort,
  ) {}

  findAll(): Promise<ContentRecord[]> {
    return this.repo.findAllActive();
  }

  findBySection(section: string): Promise<ContentRecord | null> {
    return this.repo.findBySection(section);
  }

  /**
   * Upsert per-locale content. The incoming payload is partial — `{ vi?, en? }` —
   * and is merged with the existing record so admins can save one locale at a time
   * without losing the other.
   */
  async upsert(
    section: string,
    data: unknown,
    isActive = true,
  ): Promise<ContentRecord> {
    this.validator.validate(section, data);

    const incoming = data as LocalizedContentPayload;
    const existing = await this.repo.findBySection(section);
    const existingData =
      existing && isLocalizedShape(existing.data) ? existing.data : {};

    // Pattern: Partial Merge — only locales present in the incoming payload are touched.
    const merged: Record<Locale, ContentPayload | null> = {
      vi: null,
      en: null,
    };
    for (const locale of SUPPORTED_LOCALES) {
      if (locale in incoming) {
        merged[locale] = incoming[locale] ?? null;
      } else {
        merged[locale] = (existingData[locale] ??
          null) as ContentPayload | null;
      }
    }

    return this.repo.upsert(
      section,
      merged as unknown as ContentPayload,
      isActive,
    );
  }

  async remove(section: string): Promise<ContentRecord> {
    const existing = await this.repo.findBySection(section);
    if (!existing) {
      throw new NotFoundException(`Content section "${section}" not found`);
    }
    return this.repo.deleteBySection(section);
  }

  async seed(): Promise<{ message: string }> {
    const sections = Object.entries(DEFAULT_CONTENT);
    for (const [section, data] of sections) {
      this.validator.validate(section, data);
      await this.repo.upsert(section, data as ContentPayload, true);
    }
    return { message: `Seeded ${sections.length} sections` };
  }
}

function isLocalizedShape(
  value: unknown,
): value is Record<Locale, ContentPayload | null> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  // Treat as localized if it has at least one supported locale key
  return SUPPORTED_LOCALES.some((l) => l in (value as Record<string, unknown>));
}

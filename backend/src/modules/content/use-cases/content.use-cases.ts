import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONTENT_REPOSITORY,
  CONTENT_SECTION_VALIDATOR,
} from '../content.constants';
import type { ContentRepositoryPort } from '../domain/content.repository.port';
import type { ContentSectionValidatorPort } from '../domain/content.validator.port';
import type { ContentPayload, ContentRecord } from '../domain/content.types';
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

  async upsert(
    section: string,
    data: unknown,
    isActive = true,
  ): Promise<ContentRecord> {
    this.validator.validate(section, data);
    return this.repo.upsert(section, data, isActive);
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

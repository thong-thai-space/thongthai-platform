import { Injectable } from '@nestjs/common';
import { ContentUseCases } from './use-cases/content.use-cases';
import type { LocaleOverrides } from './domain/content.types';

// Pattern: Facade — thin controller-facing API over the use cases.
@Injectable()
export class ContentService {
  constructor(private readonly useCases: ContentUseCases) {}

  getOverridesForLocale(locale: string): Promise<LocaleOverrides> {
    return this.useCases.getOverridesForLocale(locale);
  }

  upsertOverride(
    locale: string,
    namespace: string,
    data: unknown,
  ): Promise<void> {
    return this.useCases.upsertOverride(locale, namespace, data);
  }

  removeOverride(locale: string, namespace: string): Promise<void> {
    return this.useCases.removeOverride(locale, namespace);
  }
}

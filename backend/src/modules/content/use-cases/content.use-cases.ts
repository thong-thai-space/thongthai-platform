import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_REPOSITORY } from '../content.constants';
import type { ContentRepositoryPort } from '../domain/content.repository.port';
import type { LocaleOverrides } from '../domain/content.types';
import { ContentOverridePolicy } from '../policies/content-override.policy';

// Pattern: Use Case — application logic for the CMS override layer. The frontend
// deep-merges these partial overrides over its static next-intl messages, so each
// locale is fully independent and always backed by a complete compile-time default.
@Injectable()
export class ContentUseCases {
  constructor(
    @Inject(CONTENT_REPOSITORY)
    private readonly repo: ContentRepositoryPort,
    private readonly policy: ContentOverridePolicy,
  ) {}

  // Public: all namespace overrides for one locale, as { namespace: data }.
  async getOverridesForLocale(locale: string): Promise<LocaleOverrides> {
    const lang = this.policy.parseLocale(locale);
    const rows = await this.repo.findByLocale(lang);
    const map: LocaleOverrides = {};
    for (const row of rows) {
      map[row.namespace] = row.data;
    }
    return map;
  }

  // Admin: save the override payload for a single (namespace, locale).
  async upsertOverride(
    locale: string,
    namespace: string,
    data: unknown,
  ): Promise<void> {
    const lang = this.policy.parseLocale(locale);
    this.policy.assertEditableNamespace(namespace);
    const payload = this.policy.validatePayload(data);
    await this.repo.upsert(namespace, lang, payload);
  }

  // Admin: reset a namespace for one locale back to the static defaults.
  async removeOverride(locale: string, namespace: string): Promise<void> {
    const lang = this.policy.parseLocale(locale);
    this.policy.assertEditableNamespace(namespace);
    await this.repo.remove(namespace, lang);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_REPOSITORY } from '../content.constants';
import type { ContentRepositoryPort } from '../domain/content.repository.port';
import type { LocaleOverrides } from '../domain/content.types';
import { ContentOverridePolicy } from '../policies/content-override.policy';
import { R2StorageService } from '../../../shared/storage/r2-storage.service';
import { setAtPath, unsetAtPath } from '../content.path.util';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Pattern: Use Case — application logic for the CMS override layer. The frontend
// deep-merges these partial overrides over its static next-intl messages, so each
// locale is fully independent and always backed by a complete compile-time default.
@Injectable()
export class ContentUseCases {
  constructor(
    @Inject(CONTENT_REPOSITORY)
    private readonly repo: ContentRepositoryPort,
    private readonly policy: ContentOverridePolicy,
    private readonly storage: R2StorageService,
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

  // Admin: upload an image and set it at the given field for ALL locales (images
  // are shared across languages). Returns the public URL.
  async setImage(
    namespace: string,
    field: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.policy.assertEditableNamespace(namespace);
    this.policy.assertImageField(namespace, field);

    const url = await this.storage.uploadPublicFile({
      folder: 'content',
      file,
      keyPrefix: `${namespace}-${field.replace(/\./g, '_')}-`,
    });

    // Images are shared across languages — write the URL into every locale.
    for (const locale of this.policy.allLocales()) {
      const existing = await this.repo.findOne(namespace, locale);
      const base = isPlainObject(existing) ? existing : {};
      const data = setAtPath(base, field, url);
      const validated = this.policy.validatePayload(data);
      await this.repo.upsert(namespace, locale, validated);
    }

    return { url };
  }

  // Admin: clear an image field across ALL locales.
  async removeImage(namespace: string, field: string): Promise<void> {
    this.policy.assertEditableNamespace(namespace);
    this.policy.assertImageField(namespace, field);

    for (const locale of this.policy.allLocales()) {
      const existing = await this.repo.findOne(namespace, locale);
      if (!isPlainObject(existing)) continue;
      const data = unsetAtPath(existing, field);
      if (Object.keys(data).length === 0) {
        await this.repo.remove(namespace, locale);
      } else {
        await this.repo.upsert(namespace, locale, this.policy.validatePayload(data));
      }
    }
  }
}

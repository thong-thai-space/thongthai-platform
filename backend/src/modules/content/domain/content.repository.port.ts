import type { Language, Prisma } from '@prisma/client';
import type { OverrideData } from './content.types';

export interface NamespaceOverride {
  namespace: string;
  data: Prisma.JsonValue;
}

// Pattern: Repository Port — persistence contract for content overrides.
export interface ContentRepositoryPort {
  findByLocale(locale: Language): Promise<NamespaceOverride[]>;
  upsert(
    namespace: string,
    locale: Language,
    data: OverrideData,
  ): Promise<void>;
  remove(namespace: string, locale: Language): Promise<void>;
}

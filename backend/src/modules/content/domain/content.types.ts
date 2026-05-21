import type { Prisma, SiteContent } from '@prisma/client';

export type ContentPayload = Prisma.InputJsonValue;

// Pattern: Discriminated by locale key — { vi?, en? } envelope wraps the per-section payload.
// At least one locale must be present in a write; either may be null (frontend then falls
// back to compile-time i18n messages).
export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type LocalizedContentPayload = {
  [L in Locale]?: ContentPayload | null;
};

export interface ContentSection {
  section: string;
  data: LocalizedContentPayload;
  isActive: boolean;
}

export type ContentRecord = SiteContent;

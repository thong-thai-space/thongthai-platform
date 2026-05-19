import type { Prisma, SiteContent } from '@prisma/client';

export type ContentPayload = Prisma.InputJsonValue;

export interface ContentSection {
  section: string;
  data: ContentPayload;
  isActive: boolean;
}

export type ContentRecord = SiteContent;

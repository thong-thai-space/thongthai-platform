import type { ContentPayload, ContentRecord } from './content.types';

// Pattern: Repository Port — content persistence boundary
export interface ContentRepositoryPort {
  findAllActive(): Promise<ContentRecord[]>;
  findBySection(section: string): Promise<ContentRecord | null>;
  upsert(section: string, data: ContentPayload, isActive: boolean): Promise<ContentRecord>;
  deleteBySection(section: string): Promise<ContentRecord>;
}

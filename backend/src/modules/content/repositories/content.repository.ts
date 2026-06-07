import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ContentRepositoryPort,
  NamespaceOverride,
} from '../domain/content.repository.port';
import type { OverrideData } from '../domain/content.types';

// Pattern: Repository — Prisma-backed implementation of ContentRepositoryPort.
@Injectable()
export class ContentRepository implements ContentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByLocale(locale: Language): Promise<NamespaceOverride[]> {
    try {
      return await this.prisma.contentOverride.findMany({
        where: { locale },
        select: { namespace: true, data: true },
        orderBy: { namespace: 'asc' },
      });
    } catch {
      throw new InternalServerErrorException('Failed to load content overrides');
    }
  }

  async findOne(namespace: string, locale: Language) {
    try {
      const row = await this.prisma.contentOverride.findUnique({
        where: { namespace_locale: { namespace, locale } },
        select: { data: true },
      });
      return row?.data ?? null;
    } catch {
      throw new InternalServerErrorException('Failed to load content override');
    }
  }

  async upsert(
    namespace: string,
    locale: Language,
    data: OverrideData,
  ): Promise<void> {
    try {
      await this.prisma.contentOverride.upsert({
        where: { namespace_locale: { namespace, locale } },
        create: { namespace, locale, data },
        update: { data },
      });
    } catch {
      throw new InternalServerErrorException('Failed to save content override');
    }
  }

  async remove(namespace: string, locale: Language): Promise<void> {
    try {
      // Idempotent: resetting a namespace that has no override is a no-op.
      await this.prisma.contentOverride.deleteMany({
        where: { namespace, locale },
      });
    } catch {
      throw new InternalServerErrorException('Failed to reset content override');
    }
  }
}

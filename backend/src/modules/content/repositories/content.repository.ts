import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SiteContent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ContentRepositoryPort } from '../domain/content.repository.port';
import type { ContentPayload } from '../domain/content.types';

// Pattern: Repository — concrete implementation of ContentRepositoryPort
@Injectable()
export class ContentRepository implements ContentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive(): Promise<SiteContent[]> {
    return this.prisma.siteContent.findMany({
      where: { isActive: true },
      orderBy: { section: 'asc' },
    });
  }

  findBySection(section: string): Promise<SiteContent | null> {
    return this.prisma.siteContent.findUnique({ where: { section } });
  }

  async upsert(
    section: string,
    data: ContentPayload,
    isActive: boolean,
  ): Promise<SiteContent> {
    try {
      return await this.prisma.siteContent.upsert({
        where: { section },
        update: { data, isActive },
        create: { section, data, isActive },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Invalid content payload');
      }
      throw error;
    }
  }

  async deleteBySection(section: string): Promise<SiteContent> {
    try {
      return await this.prisma.siteContent.delete({ where: { section } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Content section not found');
      }
      throw error;
    }
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, SiteContent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Pattern: Repository Pattern
 * Encapsulates Content data access
 */
@Injectable()
export class ContentRepository {
  constructor(private prisma: PrismaService) {}

  async findAllActive(): Promise<SiteContent[]> {
    try {
      return await this.prisma.siteContent.findMany({
        where: { isActive: true },
        orderBy: { section: 'asc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch content');
    }
  }

  async findBySection(section: string): Promise<SiteContent | null> {
    try {
      return await this.prisma.siteContent.findUnique({ where: { section } });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch content section');
    }
  }

  async upsert(
    section: string,
    data: Prisma.InputJsonValue,
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
      throw new InternalServerErrorException('Failed to upsert content section');
    }
  }

  async deleteBySection(section: string): Promise<SiteContent> {
    try {
      return await this.prisma.siteContent.delete({ where: { section } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Content section not found');
      }
      throw new InternalServerErrorException('Failed to delete content section');
    }
  }
}

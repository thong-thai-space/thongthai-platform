import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  PortfolioRepositoryPort,
  ShowcaseProjectSummary,
  UpdateShowcaseInput,
} from '../domain/portfolio.repository.port';

// Pattern: Repository — Prisma adapter implementing PortfolioRepositoryPort.
@Injectable()
export class PortfolioRepository implements PortfolioRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findShowcaseProjects(): Promise<ShowcaseProjectSummary[]> {
    try {
      return await this.prisma.project.findMany({
        where: { isShowcase: true },
        select: {
          id: true,
          name: true,
          description: true,
          client: { select: { id: true, name: true } },
          techStack: true,
          repoUrl: true,
          liveUrl: true,
          figmaUrl: true,
          showcaseCategory: true,
          showcaseResults: true,
          thumbnailUrl: true,
          screenshots: true,
          showcaseOrder: true,
        },
        orderBy: { showcaseOrder: 'asc' },
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to fetch showcase projects',
      );
    }
  }

  async updateShowcaseProject(
    id: string,
    data: UpdateShowcaseInput,
  ): Promise<ShowcaseProjectSummary> {
    try {
      return await this.prisma.project.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          client: { select: { id: true, name: true } },
          techStack: true,
          repoUrl: true,
          liveUrl: true,
          figmaUrl: true,
          showcaseCategory: true,
          showcaseResults: true,
          thumbnailUrl: true,
          screenshots: true,
          showcaseOrder: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Project not found');
      }
      throw new InternalServerErrorException(
        'Failed to update showcase project',
      );
    }
  }
}

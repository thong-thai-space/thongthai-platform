import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type ShowcaseProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  client: { id: string; name: string } | null;
  techStack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  figmaUrl: string | null;
  showcaseCategory: string | null;
  showcaseResults: string | null;
  thumbnailUrl: string | null;
  screenshots: string[];
  showcaseOrder: number | null;
};

@Injectable()
export class PortfolioRepository {
  constructor(private prisma: PrismaService) {}

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
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch showcase projects');
    }
  }

  async updateShowcaseProject(
    projectId: string,
    data: Prisma.ProjectUpdateInput,
  ) {
    try {
      return await this.prisma.project.update({
        where: { id: projectId },
        data,
        select: {
          id: true,
          name: true,
          isShowcase: true,
          showcaseOrder: true,
          showcaseCategory: true,
          showcaseResults: true,
          liveUrl: true,
          repoUrl: true,
          figmaUrl: true,
          thumbnailUrl: true,
          screenshots: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
      throw new InternalServerErrorException('Failed to update showcase project');
    }
  }
}

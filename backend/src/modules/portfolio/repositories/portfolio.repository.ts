import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PortfolioRepository {
  constructor(private prisma: PrismaService) {}

  async findShowcaseProjects(): Promise<Project[]> {
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

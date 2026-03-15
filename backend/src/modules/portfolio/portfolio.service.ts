import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePortfolioDto } from './dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getShowcase() {
    return this.prisma.project.findMany({
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
  }

  async updateShowcase(projectId: string, dto: UpdatePortfolioDto) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
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
  }
}

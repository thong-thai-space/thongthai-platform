import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class FileRepository {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    try {
      return await this.prisma.projectFile.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch project files');
    }
  }

  async findFileWithProject(id: string) {
    try {
      return await this.prisma.projectFile.findUnique({
        where: { id },
        include: { project: { select: { id: true, clientId: true } } },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch file');
    }
  }

  async findFileProjectId(id: string) {
    try {
      return await this.prisma.projectFile.findUnique({
        where: { id },
        select: { projectId: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch file');
    }
  }

  async createFile(data: Prisma.ProjectFileCreateInput) {
    try {
      return await this.prisma.projectFile.create({ data });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create file');
    }
  }

  async deleteFile(id: string) {
    try {
      return await this.prisma.projectFile.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('File not found');
      }
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async findProjectAccess(projectId: string, userId: string) {
    try {
      return await this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          clientId: true,
          tasks: {
            where: { assigneeId: userId },
            select: { id: true },
            take: 1,
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch project access');
    }
  }
}

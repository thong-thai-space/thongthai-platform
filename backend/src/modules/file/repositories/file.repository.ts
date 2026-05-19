import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectFile } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  FileRepositoryPort,
  ProjectFileWithProject,
} from '../domain/file.repository.port';

// Pattern: Repository — concrete persistence for FileRepositoryPort
@Injectable()
export class FileRepository implements FileRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findByProject(projectId: string): Promise<ProjectFile[]> {
    return this.prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findFileWithProject(id: string): Promise<ProjectFileWithProject | null> {
    return this.prisma.projectFile.findUnique({
      where: { id },
      include: { project: { select: { id: true, clientId: true } } },
    });
  }

  findFileProjectId(id: string): Promise<{ projectId: string } | null> {
    return this.prisma.projectFile.findUnique({
      where: { id },
      select: { projectId: true },
    });
  }

  createFile(data: Prisma.ProjectFileCreateInput): Promise<ProjectFile> {
    return this.prisma.projectFile.create({ data });
  }

  async deleteFile(id: string): Promise<ProjectFile> {
    try {
      return await this.prisma.projectFile.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }

  findProjectAccess(projectId: string, userId: string) {
    return this.prisma.project.findUnique({
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
  }
}

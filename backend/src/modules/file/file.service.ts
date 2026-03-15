import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const file = await this.prisma.projectFile.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async create(data: {
    name: string;
    url: string;
    mimeType: string;
    size: number;
    projectId: string;
    uploadedBy: string;
  }) {
    return this.prisma.projectFile.create({ data });
  }

  async remove(id: string) {
    return this.prisma.projectFile.delete({ where: { id } });
  }
}

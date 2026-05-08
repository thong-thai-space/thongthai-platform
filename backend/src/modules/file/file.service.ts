import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { R2StorageService } from '../../shared/storage/r2-storage.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class FileService {
  constructor(
    private prisma: PrismaService,
    private r2StorageService: R2StorageService,
  ) {}

  async findByProject(projectId: string) {
    return this.prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const file = await this.prisma.projectFile.findUnique({
      where: { id },
      include: { project: { select: { id: true, clientId: true } } },
    });
    if (!file) throw new NotFoundException('File not found');

    // Pattern: Authorization - Per-resource access control
    await this.assertProjectAccess(file.projectId, userId, role);

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

  async uploadProjectFile(params: {
    file: Express.Multer.File;
    projectId: string;
    uploadedBy: string;
    role: UserRole;
  }) {
    const { file, projectId, uploadedBy, role } = params;

    await this.assertProjectAccess(projectId, uploadedBy, role);

    const url = await this.r2StorageService.uploadPublicFile({
      folder: 'project-files',
      file,
      keyPrefix: projectId,
    });

    return this.prisma.projectFile.create({
      data: {
        name: file.originalname || `file-${Date.now()}`,
        url,
        mimeType: file.mimetype || 'application/octet-stream',
        size: file.size || 0,
        projectId,
        uploadedBy,
      },
    });
  }

  async remove(id: string, userId: string, role: UserRole) {
    const file = await this.prisma.projectFile.findUnique({
      where: { id },
      select: { projectId: true },
    });
    if (!file) throw new NotFoundException('File not found');

    // Pattern: Authorization - Per-resource access control
    await this.assertProjectAccess(file.projectId, userId, role);

    return this.prisma.projectFile.delete({ where: { id } });
  }

  private async assertProjectAccess(
    projectId: string,
    userId: string,
    role: UserRole,
  ) {
    if (role === UserRole.OWNER || role === UserRole.ADMIN) return;

    const project = await this.prisma.project.findUnique({
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

    if (!project) throw new NotFoundException('Project not found');

    if (role === UserRole.CLIENT && project.clientId === userId) return;
    if (role === UserRole.MEMBER && project.tasks.length > 0) return;

    throw new ForbiddenException('You do not have permission for this project');
  }
}

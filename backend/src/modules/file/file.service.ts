import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { R2StorageService } from '../../shared/storage/r2-storage.service';
import { UserRole } from '@prisma/client';
import { FileRepository } from './repositories/file.repository';

@Injectable()
export class FileService {
  constructor(
    private fileRepository: FileRepository,
    private r2StorageService: R2StorageService,
  ) {}

  async findByProject(projectId: string) {
    return this.fileRepository.findByProject(projectId);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const file = await this.fileRepository.findFileWithProject(id);
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
    return this.fileRepository.createFile({
      name: data.name,
      url: data.url,
      mimeType: data.mimeType,
      size: data.size,
      project: { connect: { id: data.projectId } },
      uploader: { connect: { id: data.uploadedBy } },
    });
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

    return this.fileRepository.createFile({
      name: file.originalname || `file-${Date.now()}`,
      url,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size || 0,
      project: { connect: { id: projectId } },
      uploader: { connect: { id: uploadedBy } },
    });
  }

  async remove(id: string, userId: string, role: UserRole) {
    const file = await this.fileRepository.findFileProjectId(id);
    if (!file) throw new NotFoundException('File not found');

    // Pattern: Authorization - Per-resource access control
    await this.assertProjectAccess(file.projectId, userId, role);

    return this.fileRepository.deleteFile(id);
  }

  private async assertProjectAccess(
    projectId: string,
    userId: string,
    role: UserRole,
  ) {
    if (role === UserRole.OWNER || role === UserRole.ADMIN) return;

    const project = await this.fileRepository.findProjectAccess(projectId, userId);

    if (!project) throw new NotFoundException('Project not found');

    if (role === UserRole.CLIENT && project.clientId === userId) return;
    if (role === UserRole.MEMBER && project.tasks.length > 0) return;

    throw new ForbiddenException('You do not have permission for this project');
  }
}

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FILE_REPOSITORY, FILE_STORAGE, FILE_UPLOAD_LIMITS } from '../file.constants';
import type { FileRepositoryPort } from '../domain/file.repository.port';
import type { FileStoragePort } from '../domain/file.storage.port';
import { ProjectAccessPolicy } from '../policies/project-access.policy';

// Pattern: Use Case — file lifecycle within a project (read/upload/delete)
@Injectable()
export class FileUseCases {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly repo: FileRepositoryPort,
    @Inject(FILE_STORAGE)
    private readonly storage: FileStoragePort,
    private readonly accessPolicy: ProjectAccessPolicy,
  ) {}

  findByProject(projectId: string) {
    return this.repo.findByProject(projectId);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const file = await this.repo.findFileWithProject(id);
    if (!file) throw new NotFoundException('File not found');

    await this.accessPolicy.assertCanAccess(file.projectId, userId, role);
    return file;
  }

  create(data: {
    name: string;
    url: string;
    mimeType: string;
    size: number;
    projectId: string;
    uploadedBy: string;
  }) {
    return this.repo.createFile({
      name: data.name,
      url: data.url,
      mimeType: data.mimeType,
      size: data.size,
      project: { connect: { id: data.projectId } },
      uploadedBy: data.uploadedBy,
    });
  }

  async uploadProjectFile(params: {
    file: Express.Multer.File;
    projectId: string;
    uploadedBy: string;
    role: UserRole;
  }) {
    const { file, projectId, uploadedBy, role } = params;
    this.assertWithinSizeLimit(file);

    await this.accessPolicy.assertCanAccess(projectId, uploadedBy, role);

    const url = await this.storage.uploadPublicFile({
      folder: 'project-files',
      file,
      keyPrefix: projectId,
    });

    return this.repo.createFile({
      name: file.originalname || `file-${Date.now()}`,
      url,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size || 0,
      project: { connect: { id: projectId } },
      uploadedBy,
    });
  }

  async remove(id: string, userId: string, role: UserRole) {
    const file = await this.repo.findFileProjectId(id);
    if (!file) throw new NotFoundException('File not found');

    await this.accessPolicy.assertCanAccess(file.projectId, userId, role);
    return this.repo.deleteFile(id);
  }

  private assertWithinSizeLimit(file: Express.Multer.File): void {
    if ((file.size || 0) > FILE_UPLOAD_LIMITS.MAX_BYTES) {
      throw new BadRequestException(
        `File exceeds the ${FILE_UPLOAD_LIMITS.MAX_BYTES} byte limit`,
      );
    }
  }
}

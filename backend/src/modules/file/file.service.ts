import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FileUseCases } from './use-cases/file.use-cases';

// Pattern: Facade — controllers depend on this; FileUseCases owns behavior
@Injectable()
export class FileService {
  constructor(private readonly useCases: FileUseCases) {}

  findByProject(projectId: string, userId: string, role: UserRole) {
    return this.useCases.findByProject(projectId, userId, role);
  }

  findOne(id: string, userId: string, role: UserRole) {
    return this.useCases.findOne(id, userId, role);
  }

  create(
    data: {
      name: string;
      url: string;
      mimeType: string;
      size: number;
      projectId: string;
      uploadedBy: string;
    },
    role: UserRole,
  ) {
    return this.useCases.create(data, role);
  }

  uploadProjectFile(params: {
    file: Express.Multer.File;
    projectId: string;
    uploadedBy: string;
    role: UserRole;
  }) {
    return this.useCases.uploadProjectFile(params);
  }

  remove(id: string, userId: string, role: UserRole) {
    return this.useCases.remove(id, userId, role);
  }
}

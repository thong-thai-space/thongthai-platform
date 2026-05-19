import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FILE_REPOSITORY } from '../file.constants';
import type { FileRepositoryPort } from '../domain/file.repository.port';

// Pattern: Policy — centralizes per-project authorization for file operations
@Injectable()
export class ProjectAccessPolicy {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly repo: FileRepositoryPort,
  ) {}

  async assertCanAccess(projectId: string, userId: string, role: UserRole): Promise<void> {
    if (role === UserRole.OWNER || role === UserRole.ADMIN) return;

    const project = await this.repo.findProjectAccess(projectId, userId);
    if (!project) throw new NotFoundException('Project not found');

    if (role === UserRole.CLIENT && project.clientId === userId) return;
    if (role === UserRole.MEMBER && project.tasks.length > 0) return;

    throw new ForbiddenException('You do not have permission for this project');
  }
}

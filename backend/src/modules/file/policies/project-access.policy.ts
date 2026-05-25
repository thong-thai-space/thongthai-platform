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
//
// SECURITY: OWNER/ADMIN are NOT global super-users. This SaaS is multi-tenant
// (each OWNER owns their own projects); access is granted only when the
// project actually belongs to the caller (or, for CLIENT/MEMBER, when they
// are explicitly attached to it).
@Injectable()
export class ProjectAccessPolicy {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly repo: FileRepositoryPort,
  ) {}

  async assertCanAccess(
    projectId: string,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const project = await this.repo.findProjectAccess(projectId, userId);
    if (!project) throw new NotFoundException('Project not found');

    // OWNER/ADMIN: only their own projects (multi-tenant isolation).
    if (
      (role === UserRole.OWNER || role === UserRole.ADMIN) &&
      project.ownerId === userId
    ) {
      return;
    }
    if (role === UserRole.CLIENT && project.clientId === userId) return;
    if (role === UserRole.MEMBER && project.tasks.length > 0) return;

    throw new ForbiddenException('You do not have permission for this project');
  }
}

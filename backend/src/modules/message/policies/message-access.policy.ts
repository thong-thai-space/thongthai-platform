import { ForbiddenException, Injectable } from '@nestjs/common';

const INTERNAL_ROLES = new Set(['OWNER', 'ADMIN', 'MEMBER']);

@Injectable()
export class MessageAccessPolicy {
  assertCanReadProjectConversation(opts: {
    userId: string;
    project: { ownerId: string | null; clientId: string | null } | null;
    role?: string;
  }): void {
    const { userId, project, role } = opts;
    if (!project) return; // Empty conversation handled at the caller
    if (project.ownerId === userId || project.clientId === userId) return;
    if (role && INTERNAL_ROLES.has(role)) return;
    throw new ForbiddenException();
  }
}

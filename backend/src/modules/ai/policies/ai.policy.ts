import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  AiApplyRequestWithProject,
  AiStrategicProject,
} from '../domain/ai.types';
import { UserRole } from '@prisma/client';

// Pattern: Policy
@Injectable()
export class AiPolicy {
  assertOwnerOrAdmin(role: UserRole) {
    if (role !== UserRole.OWNER && role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }
  }

  assertOwnerOnly(
    role: UserRole,
    message = 'Only OWNER can perform this action',
  ) {
    if (role !== UserRole.OWNER) {
      throw new ForbiddenException(message);
    }
  }

  assertApplyRequestPending(request: AiApplyRequestWithProject) {
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Apply request already reviewed');
    }
  }

  assertAuditAccess(
    role: UserRole,
    auditUserId: string,
    currentUserId: string,
  ) {
    if (
      role !== UserRole.OWNER &&
      role !== UserRole.ADMIN &&
      auditUserId !== currentUserId
    ) {
      throw new ForbiddenException();
    }
  }

  assertStrategicPlanAccess(
    project: AiStrategicProject,
    role: UserRole,
    userId: string,
  ) {
    if (role === UserRole.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException();
    }

    if (role === UserRole.MEMBER) {
      const hasAssignedTask = project.tasks.some(
        (task) => task.assigneeId === userId,
      );
      if (!hasAssignedTask) throw new ForbiddenException();
    }
  }

  assertArchitectureTrialLimit(usedRequests: number, limit: number) {
    if (usedRequests >= limit) {
      throw new HttpException(
        `Trial limit reached: maximum ${limit} requests`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

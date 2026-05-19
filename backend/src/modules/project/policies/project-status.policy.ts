import { BadRequestException, Injectable } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';

// Pattern: State Machine — defines legal project status transitions
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: [ProjectStatus.PROPOSAL_SENT, ProjectStatus.CANCELLED],
  PROPOSAL_SENT: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
  IN_PROGRESS: [
    ProjectStatus.ON_HOLD,
    ProjectStatus.REVIEW,
    ProjectStatus.CANCELLED,
  ],
  ON_HOLD: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
  REVIEW: [
    ProjectStatus.IN_PROGRESS,
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED,
  ],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class ProjectStatusPolicy {
  assertTransition(from: ProjectStatus, to: ProjectStatus): void {
    if (from === to) return;
    const allowed = VALID_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Cannot transition from ${from} to ${to}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
  }
}

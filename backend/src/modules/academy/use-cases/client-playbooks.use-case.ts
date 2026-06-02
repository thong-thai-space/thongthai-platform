import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACADEMY_REPOSITORY } from '../academy.constants';
import type { AcademyRepositoryPort } from '../domain/academy.repository.port';
import type { ProgressAction } from '../domain/academy.types';
import { PlaybookProgressPolicy } from '../policies/playbook-progress.policy';

/**
 * Pattern: Use Case — the client-facing side of Academy. Every method is scoped
 * by `clientId` (the authenticated client's own id) so one client can never read
 * or mutate another's assignment (plan §5.1 tenant isolation).
 */
@Injectable()
export class ClientPlaybooksUseCase {
  constructor(
    @Inject(ACADEMY_REPOSITORY)
    private readonly repo: AcademyRepositoryPort,
    private readonly progressPolicy: PlaybookProgressPolicy,
  ) {}

  listMine(clientId: string) {
    return this.repo.listAssignmentsForClient(clientId);
  }

  async getMine(assignmentId: string, clientId: string) {
    const assignment = await this.repo.findAssignmentForClient(
      assignmentId,
      clientId,
    );
    if (!assignment) throw new NotFoundException('Playbook not found');
    return assignment;
  }

  async updateProgress(
    assignmentId: string,
    clientId: string,
    action: ProgressAction,
  ) {
    // Re-fetch under the client scope first — this is both the existence check
    // and the tenant guard before we mutate.
    const assignment = await this.getMine(assignmentId, clientId);
    const next = this.progressPolicy.resolve(assignment.status, action);
    return this.repo.updateAssignmentProgress(assignmentId, next);
  }
}

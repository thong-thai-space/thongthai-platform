import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlaybookStatus } from '@prisma/client';
import { ACADEMY_REPOSITORY } from '../academy.constants';
import type { AcademyRepositoryPort } from '../domain/academy.repository.port';

/**
 * Pattern: Use Case — delivers a published playbook to a client and manages the
 * delivery list. A DRAFT/ARCHIVED playbook cannot be assigned: clients only ever
 * receive content that has cleared the publish gate (PlaybookPublishPolicy).
 */
@Injectable()
export class AssignPlaybookUseCase {
  constructor(
    @Inject(ACADEMY_REPOSITORY)
    private readonly repo: AcademyRepositoryPort,
  ) {}

  async assign(playbookId: string, clientId: string, assignedById: string) {
    const playbook = await this.repo.findPlaybookById(playbookId);
    if (!playbook) throw new NotFoundException('Playbook not found');
    if (playbook.status !== PlaybookStatus.PUBLISHED) {
      throw new BadRequestException(
        'Only a published playbook can be assigned to a client',
      );
    }
    return this.repo.assign(playbookId, clientId, assignedById);
  }

  async unassign(assignmentId: string) {
    await this.repo.unassign(assignmentId);
  }

  async listAssignees(playbookId: string) {
    await this.assertPlaybookExists(playbookId);
    return this.repo.listAssignmentsForPlaybook(playbookId);
  }

  private async assertPlaybookExists(playbookId: string) {
    const playbook = await this.repo.findPlaybookById(playbookId);
    if (!playbook) throw new NotFoundException('Playbook not found');
  }
}

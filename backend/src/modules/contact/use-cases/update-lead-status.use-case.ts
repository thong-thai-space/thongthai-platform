import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ContactRequestStatus } from '@prisma/client';
import { CONTACT_REPOSITORY } from '../contact.constants';
import type { ContactRepositoryPort } from '../domain/contact.repository.port';
import { ContactStatusPolicy } from '../policies/contact-status.policy';

// Pattern: Use Case
@Injectable()
export class UpdateLeadStatusUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly repo: ContactRepositoryPort,
    private readonly statusPolicy: ContactStatusPolicy,
  ) {}

  async execute(id: string, nextStatus: ContactRequestStatus) {
    const existing = await this.repo.findContactRequestById(id);
    if (!existing) {
      throw new NotFoundException('Contact request not found');
    }

    this.statusPolicy.assertTransition(existing.status, nextStatus);
    return this.repo.updateContactRequestStatus(id, nextStatus);
  }
}

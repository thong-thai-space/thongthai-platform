import { Inject, Injectable } from '@nestjs/common';
import { ContactRequestStatus } from '@prisma/client';
import { CONTACT_REPOSITORY } from '../contact.constants';
import type {
  ContactListResult,
  ContactRepositoryPort,
} from '../domain/contact.repository.port';

export interface ListLeadsInput {
  status?: ContactRequestStatus;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Pattern: Use Case
@Injectable()
export class ListLeadsUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly repo: ContactRepositoryPort,
  ) {}

  async execute(input: ListLeadsInput): Promise<ContactListResult> {
    const page = Math.max(1, input.page ?? DEFAULT_PAGE);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE),
    );

    return this.repo.listContactRequests({
      status: input.status,
      page,
      pageSize,
    });
  }
}

import { ContactRequest, ContactRequestStatus, Prisma } from '@prisma/client';

// Pattern: Repository Port
export interface ContactRepositoryPort {
  createContactRequest(
    data: Prisma.ContactRequestCreateInput,
  ): Promise<ContactRequest>;

  findActiveAdminIds(): Promise<string[]>;

  listContactRequests(filter: ContactListFilter): Promise<ContactListResult>;

  findContactRequestById(id: string): Promise<ContactRequest | null>;

  updateContactRequestStatus(
    id: string,
    status: ContactRequestStatus,
  ): Promise<ContactRequest>;
}

export interface ContactListFilter {
  status?: ContactRequestStatus;
  page: number;
  pageSize: number;
}

export interface ContactListResult {
  items: ContactRequest[];
  total: number;
  page: number;
  pageSize: number;
}

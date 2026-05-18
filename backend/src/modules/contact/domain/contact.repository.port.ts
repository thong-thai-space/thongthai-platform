import { ContactRequest, Prisma } from '@prisma/client';

// Pattern: Repository Port
export interface ContactRepositoryPort {
  createContactRequest(data: Prisma.ContactRequestCreateInput): Promise<ContactRequest>;
  findActiveAdminIds(): Promise<string[]>;
}

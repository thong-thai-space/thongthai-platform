import { Invoice, Prisma, UserRole } from '@prisma/client';

// Pattern: Repository Port
export interface InvoiceRepositoryPort {
  findAll(where?: Prisma.InvoiceWhereInput): Promise<Invoice[]>;
  findById(id: string): Promise<Invoice | null>;
  create(data: Prisma.InvoiceCreateInput): Promise<Invoice>;
  update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice>;
  delete(id: string): Promise<boolean>;
  generateNextInvoiceNumber(prefix?: string): Promise<string>;
  findClientSummary(
    clientId: string,
  ): Promise<{ id: string; role: UserRole; isActive: boolean } | null>;
  findProjectSummary(
    projectId: string,
  ): Promise<{ id: string; clientId: string | null } | null>;
}

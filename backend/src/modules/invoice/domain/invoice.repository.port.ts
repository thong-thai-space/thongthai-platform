import { Invoice, Prisma, UserRole } from '@prisma/client';

/** Invoice with everything a PDF/report needs joined in. */
export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { items: true; client: true; creator: true; project: true };
}>;

// Pattern: Repository Port
export interface InvoiceRepositoryPort {
  findAll(where?: Prisma.InvoiceWhereInput): Promise<Invoice[]>;
  findById(id: string): Promise<Invoice | null>;
  /** Full invoice (items + client + creator + project) for document rendering. */
  findByIdWithRelations(id: string): Promise<InvoiceWithRelations | null>;
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

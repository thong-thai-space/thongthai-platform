import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';

/**
 * Pattern: Repository Pattern
 * Encapsulates all Invoice data access
 */
@Injectable()
export class InvoiceRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all invoices (with filtering)
   */
  async findAll(where?: Prisma.InvoiceWhereInput): Promise<Invoice[]> {
    try {
      return await this.prisma.invoice.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
      });
    } catch (error) {
      throw new Error(`Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find invoice by ID (with items included)
   */
  async findById(id: string): Promise<Invoice | null> {
    try {
      return await this.prisma.invoice.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new Error(`Failed to find invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create invoice
   */
  async create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    try {
      return await this.prisma.invoice.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        (error.meta?.target as string[])?.includes('invoiceNumber')
      ) {
        throw new Error('Invoice number already exists');
      }
      throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update invoice
   */
  async update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
    try {
      return await this.prisma.invoice.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('Invoice not found');
      }
      throw new Error(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete invoice (only if DRAFT)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        select: { status: true },
      });

      if (invoice?.status !== 'DRAFT') {
        throw new Error('Can only delete draft invoices');
      }

      await this.prisma.invoice.delete({ where: { id } });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find invoices by client
   */
  async findByClient(clientId: string): Promise<Invoice[]> {
    try {
      return await this.prisma.invoice.findMany({
        where: { clientId },
        orderBy: [{ createdAt: 'desc' }],
      });
    } catch (error) {
      throw new Error(`Failed to find client invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find invoices by status
   */
  async findByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    try {
      return await this.prisma.invoice.findMany({
        where: { status },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      throw new Error(`Failed to find invoices by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find overdue invoices
   */
  async findOverdue(): Promise<Invoice[]> {
    try {
      return await this.prisma.invoice.findMany({
        where: {
          status: 'SENT',
          dueDate: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to find overdue invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count invoices
   */
  async count(where?: Prisma.InvoiceWhereInput): Promise<number> {
    try {
      return await this.prisma.invoice.count({ where });
    } catch (error) {
      throw new Error(`Failed to count invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate next invoice number
   */
  async generateNextInvoiceNumber(prefix: string = 'INV'): Promise<string> {
    try {
      const latestInvoice = await this.prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith: prefix } },
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true },
      });

      const nextSeq = latestInvoice
        ? parseInt(latestInvoice.invoiceNumber.replace(prefix, '')) + 1
        : 1;

      return `${prefix}${String(nextSeq).padStart(6, '0')}`;
    } catch (error) {
      throw new Error(`Failed to generate invoice number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

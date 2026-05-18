import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Invoice, InvoiceStatus, Prisma, UserRole } from '@prisma/client';
import { InvoiceRepositoryPort } from '../domain/invoice.repository.port';

/**
 * Pattern: Repository Pattern
 * Encapsulates all Invoice data access
 */
@Injectable()
export class InvoiceRepository implements InvoiceRepositoryPort {
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
      throw new InternalServerErrorException('Failed to fetch invoices');
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
      throw new InternalServerErrorException('Failed to find invoice');
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
        throw new ConflictException('Invoice number already exists');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Invalid relation data (client/project)');
      }
      throw new InternalServerErrorException('Failed to create invoice');
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
        throw new NotFoundException('Invoice not found');
      }
      throw new InternalServerErrorException('Failed to update invoice');
    }
  }

  /**
   * Delete invoice (only if DRAFT)
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.invoice.delete({ where: { id } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Invoice not found');
      }
      throw new InternalServerErrorException('Failed to delete invoice');
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
      throw new InternalServerErrorException('Failed to find client invoices');
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
      throw new InternalServerErrorException('Failed to find invoices by status');
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
      throw new InternalServerErrorException('Failed to find overdue invoices');
    }
  }

  /**
   * Count invoices
   */
  async count(where?: Prisma.InvoiceWhereInput): Promise<number> {
    try {
      return await this.prisma.invoice.count({ where });
    } catch (error) {
      throw new InternalServerErrorException('Failed to count invoices');
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
      throw new InternalServerErrorException('Failed to generate invoice number');
    }
  }

  async findClientSummary(
    clientId: string,
  ): Promise<{ id: string; role: UserRole; isActive: boolean } | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true, role: true, isActive: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch client');
    }
  }

  async findProjectSummary(
    projectId: string,
  ): Promise<{ id: string; clientId: string | null } | null> {
    try {
      return await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, clientId: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch project');
    }
  }
}

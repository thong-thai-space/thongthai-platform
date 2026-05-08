import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, UserRole, InvoiceStatus } from '@prisma/client';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { TaxCalculator } from '../../shared/utils/tax-calculator';
import { InvoiceRepository } from './repositories/invoice.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(
    private invoiceRepository: InvoiceRepository,
    private prisma: PrismaService,
  ) {}

  async findAll(userId: string, role: UserRole) {
    const where = role === UserRole.CLIENT ? { clientId: userId } : undefined;
    return this.invoiceRepository.findAll(where);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');

    // Pattern: Authorization - Per-resource access control
    // OWNER/ADMIN can access any invoice; CLIENT can only access their own
    if (role === UserRole.CLIENT && invoice.clientId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this invoice',
      );
    }

    return invoice;
  }

  async create(dto: CreateInvoiceDto, creatorId: string) {
    const {
      items,
      taxRate,
      subtotal: _sub,
      tax: _tax,
      total: _total,
      ...invoiceData
    } = dto;

    if (!items?.length) {
      throw new BadRequestException(
        'Invoice must contain at least one line item',
      );
    }

    const client = await this.prisma.user.findUnique({
      where: { id: dto.clientId },
      select: { id: true, role: true, isActive: true },
    });
    if (!client || !client.isActive || client.role !== UserRole.CLIENT) {
      throw new BadRequestException('Invalid client selected');
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
        select: { id: true, clientId: true },
      });
      if (!project) {
        throw new BadRequestException('Selected project does not exist');
      }
      if (project.clientId && project.clientId !== dto.clientId) {
        throw new BadRequestException(
          'Selected project does not belong to this client',
        );
      }
    }

    const dueDate = new Date(dto.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid due date');
    }

    // Compute item amounts
    const computedItems = items.map((item) => {
      const qty = item.quantity ?? 1;
      if (qty <= 0) {
        throw new BadRequestException('Item quantity must be greater than 0');
      }
      if (item.unitPrice < 0) {
        throw new BadRequestException('Item unit price cannot be negative');
      }
      const amount = qty * item.unitPrice;
      return {
        description: item.description,
        quantity: qty,
        unitPrice: item.unitPrice,
        amount,
      };
    });

    const subtotal = computedItems.reduce(
      (sum, it) => sum + Number(it.amount),
      0,
    );
    const rate = taxRate ?? 0;
    // Pattern: Precision - Use TaxCalculator for accurate financial arithmetic
    const tax =
      TaxCalculator.calculateTax(TaxCalculator.toCents(subtotal), rate) / 100;
    const discount = dto.discount ?? 0;
    const total = subtotal + tax - discount;

    const invoiceNumber = await this.generateInvoiceNumber();

    const createData: Prisma.InvoiceCreateInput = {
      ...invoiceData,
      dueDate,
      invoiceNumber,
      creatorId,
      subtotal,
      tax,
      discount,
      total,
      items: {
        create: computedItems,
      },
    } as any;

    try {
      return await this.invoiceRepository.create(createData);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Invalid relation data (client/project)',
          );
        }
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Invoice number conflict, please retry',
          );
        }
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const existingInvoice = await this.invoiceRepository.findById(id);

    if (!existingInvoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Pattern: State Machine - Validate invoice status transitions
    if (dto.status && dto.status !== existingInvoice.status) {
      this.validateStatusTransition(
        existingInvoice.status as InvoiceStatus,
        dto.status as InvoiceStatus,
      );
    }

    const updateData: Prisma.InvoiceUpdateInput = {
      ...dto,
    };

    if (dto.status === 'PAID') {
      updateData.paidAt = new Date();
      updateData.paidAmount = existingInvoice.total;
    }

    return this.invoiceRepository.update(id, updateData);
  }

  private validateStatusTransition(
    currentStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
  ): void {
    // Pattern: State Machine - Define valid transitions
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      DRAFT: ['SENT', 'CANCELLED'],
      SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
      PAID: [], // Terminal state
      OVERDUE: ['PAID', 'CANCELLED'],
      CANCELLED: [], // Terminal state
    };

    const allowedNextStates = validTransitions[currentStatus];
    if (!allowedNextStates.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedNextStates.join(', ') || 'none'}`,
      );
    }
  }

  async remove(id: string) {
    await this.invoiceRepository.delete(id);
    return { success: true };
  }

  private async generateInvoiceNumber(): Promise<string> {
    return this.invoiceRepository.generateNextInvoiceNumber('INV');
  }
}

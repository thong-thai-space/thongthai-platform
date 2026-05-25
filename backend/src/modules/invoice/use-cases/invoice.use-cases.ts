import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma, UserRole } from '@prisma/client';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../dto/invoice.dto';
import { TaxCalculator } from '../../../shared/utils/tax-calculator';
import { INVOICE_REPOSITORY } from '../invoice.constants';
import type { InvoiceRepositoryPort } from '../domain/invoice.repository.port';
import { InvoicePolicy } from '../policies/invoice.policy';

// Pattern: Use Case
@Injectable()
export class InvoiceUseCases {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private invoiceRepository: InvoiceRepositoryPort,
    private invoicePolicy: InvoicePolicy,
  ) {}

  async findAll(userId: string, role: UserRole) {
    const where = role === UserRole.CLIENT ? { clientId: userId } : undefined;
    return this.invoiceRepository.findAll(where);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');

    this.invoicePolicy.assertCanView(role, invoice, userId);
    return invoice;
  }

  async create(dto: CreateInvoiceDto, creatorId: string) {
    const {
      items,
      taxRate,
      subtotal: _subtotal,
      tax: _tax,
      total: _total,
      ...invoiceData
    } = dto;

    if (!items?.length) {
      throw new BadRequestException(
        'Invoice must contain at least one line item',
      );
    }

    const client = await this.invoiceRepository.findClientSummary(dto.clientId);
    if (!client || !client.isActive || client.role !== UserRole.CLIENT) {
      throw new BadRequestException('Invalid client selected');
    }

    if (dto.projectId) {
      const project = await this.invoiceRepository.findProjectSummary(
        dto.projectId,
      );
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

    const computedItems: Prisma.InvoiceItemCreateWithoutInvoiceInput[] =
      items.map((item) => {
        const quantity = item.quantity ?? 1;
        if (quantity <= 0) {
          throw new BadRequestException('Item quantity must be greater than 0');
        }
        if (item.unitPrice < 0) {
          throw new BadRequestException('Item unit price cannot be negative');
        }

        const amount = quantity * item.unitPrice;
        return {
          description: item.description,
          quantity,
          unitPrice: item.unitPrice,
          amount,
        };
      });

    const subtotal = computedItems.reduce(
      (sum, it) => sum + Number(it.amount),
      0,
    );
    const rate = taxRate ?? 0;
    const tax =
      TaxCalculator.calculateTax(TaxCalculator.toCents(subtotal), rate) / 100;
    const discount = dto.discount ?? 0;
    const total = subtotal + tax - discount;

    const invoiceNumber = await this.generateInvoiceNumber();

    const { clientId, projectId, ...restInvoiceData } = invoiceData;
    const createData: Prisma.InvoiceCreateInput = {
      ...restInvoiceData,
      dueDate,
      invoiceNumber,
      creator: { connect: { id: creatorId } },
      client: { connect: { id: clientId } },
      ...(projectId ? { project: { connect: { id: projectId } } } : {}),
      subtotal,
      tax,
      discount,
      total,
      items: { create: computedItems },
    };

    return this.invoiceRepository.create(createData);
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const existingInvoice = await this.invoiceRepository.findById(id);

    if (!existingInvoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (dto.status && dto.status !== existingInvoice.status) {
      this.invoicePolicy.assertValidStatusTransition(
        existingInvoice.status,
        dto.status,
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

  async remove(id: string) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');

    this.invoicePolicy.assertCanDelete(invoice);
    await this.invoiceRepository.delete(id);
    return { success: true };
  }

  private async generateInvoiceNumber(): Promise<string> {
    return this.invoiceRepository.generateNextInvoiceNumber('INV');
  }
}

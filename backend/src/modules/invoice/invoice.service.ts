import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, role: UserRole) {
    const where = role === UserRole.CLIENT ? { clientId: userId } : {};

    return this.prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        items: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(dto: CreateInvoiceDto, creatorId: string) {
    const { items, taxRate, subtotal: _sub, tax: _tax, total: _total, ...invoiceData } = dto;

    if (!items?.length) {
      throw new BadRequestException('Invoice must contain at least one line item');
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
        throw new BadRequestException('Selected project does not belong to this client');
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
      return { description: item.description, quantity: qty, unitPrice: item.unitPrice, amount };
    });

    const subtotal = computedItems.reduce((sum, it) => sum + Number(it.amount), 0);
    const rate = taxRate ?? 0;
    const tax = Math.round(subtotal * rate) / 100;
    const discount = dto.discount ?? 0;
    const total = subtotal + tax - discount;

    const invoiceNumber = await this.generateInvoiceNumber();

    try {
      return await this.prisma.invoice.create({
        data: {
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
        },
        include: { items: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid relation data (client/project)');
        }
        if (error.code === 'P2002') {
          throw new BadRequestException('Invoice number conflict, please retry');
        }
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const data: UpdateInvoiceDto & { paidAt?: Date; paidAmount?: any } = {
      ...dto,
    };

    if (dto.status === 'PAID') {
      data.paidAt = new Date();
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
      });
      data.paidAmount = invoice?.total;
    }

    return this.prisma.invoice.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async remove(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}

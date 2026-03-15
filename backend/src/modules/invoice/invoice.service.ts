import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
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
    const { items, ...invoiceData } = dto;

    const invoiceNumber = await this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        ...invoiceData,
        invoiceNumber,
        creatorId,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });
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

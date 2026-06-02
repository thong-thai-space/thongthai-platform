import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { QuoteDto } from './dto/quote.dto';
import { InvoiceUseCases } from './use-cases/invoice.use-cases';

@Injectable()
export class InvoiceService {
  constructor(private invoiceUseCases: InvoiceUseCases) {}

  async findAll(userId: string, role: UserRole) {
    return this.invoiceUseCases.findAll(userId, role);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    return this.invoiceUseCases.findOne(id, userId, role);
  }

  async create(dto: CreateInvoiceDto, creatorId: string) {
    return this.invoiceUseCases.create(dto, creatorId);
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    return this.invoiceUseCases.update(id, dto);
  }

  async remove(id: string) {
    return this.invoiceUseCases.remove(id);
  }

  async generatePdf(id: string, userId: string, role: UserRole) {
    return this.invoiceUseCases.generatePdf(id, userId, role);
  }

  async generateRevenueReport() {
    return this.invoiceUseCases.generateRevenueReport();
  }

  async generateQuotePdf(quote: QuoteDto) {
    return this.invoiceUseCases.generateQuotePdf(quote);
  }
}

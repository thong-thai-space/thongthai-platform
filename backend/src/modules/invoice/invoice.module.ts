import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceRepository } from './repositories/invoice.repository';
import { InvoiceUseCases } from './use-cases/invoice.use-cases';
import { InvoicePolicy } from './policies/invoice.policy';
import { INVOICE_REPOSITORY } from './invoice.constants';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [ExportModule],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    InvoiceUseCases,
    InvoicePolicy,
    InvoiceRepository,
    { provide: INVOICE_REPOSITORY, useExisting: InvoiceRepository },
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}

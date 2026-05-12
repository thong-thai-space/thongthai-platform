import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { PdfGenerator } from './generators/pdf.generator';
import { DocxGenerator } from './generators/docx.generator';
import { XlsxGenerator } from './generators/xlsx.generator';

@Module({
  providers: [ExportService, PdfGenerator, DocxGenerator, XlsxGenerator],
  exports: [ExportService],
})
export class ExportModule {}

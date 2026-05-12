import { BadRequestException, Injectable } from '@nestjs/common';
import { ExportRequestDto, ExportFormat } from './dto/export.dto';
import { ExportGenerator } from './generators/export-generator';
import { PdfGenerator } from './generators/pdf.generator';
import { DocxGenerator } from './generators/docx.generator';
import { XlsxGenerator } from './generators/xlsx.generator';

@Injectable()
export class ExportService {
  constructor(
    private pdfGenerator: PdfGenerator,
    private docxGenerator: DocxGenerator,
    private xlsxGenerator: XlsxGenerator,
  ) {}

  // Pattern: Strategy - delegate to format-specific generator.
  private resolveGenerator(format: ExportFormat): ExportGenerator {
    switch (format) {
      case ExportFormat.PDF:
        return this.pdfGenerator;
      case ExportFormat.DOCX:
        return this.docxGenerator;
      case ExportFormat.XLSX:
        return this.xlsxGenerator;
      default:
        throw new BadRequestException('Unsupported export format');
    }
  }

  async generate(request: ExportRequestDto): Promise<Buffer> {
    const generator = this.resolveGenerator(request.format);
    return generator.generate(request.data ?? {});
  }
}

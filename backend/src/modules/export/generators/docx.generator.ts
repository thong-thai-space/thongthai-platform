import { Injectable, NotImplementedException } from '@nestjs/common';
import { ExportGenerator } from './export-generator';

@Injectable()
export class DocxGenerator implements ExportGenerator {
  // TECH DEBT: DOCX export is not implemented yet — only PDF and XLSX are wired.
  // The param is omitted (still satisfies ExportGenerator) until there's a use case.
  generate(): Promise<Buffer> {
    throw new NotImplementedException('DOCX export is not implemented yet');
  }
}
